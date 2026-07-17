"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { computeShipping } from "@/lib/utils";
import type { CartItemWithProduct, Coupon } from "@/lib/types";

function computeDiscount(coupon: Coupon, subtotal: number): number {
  if (subtotal < coupon.min_order_amount) return 0;
  let d =
    coupon.discount_type === "percentage"
      ? (subtotal * coupon.discount_value) / 100
      : coupon.discount_value;
  if (coupon.max_discount != null) d = Math.min(d, coupon.max_discount);
  return Math.min(Math.round(d * 100) / 100, subtotal);
}

/** Human-friendly, reasonably unique order number (schema has no default). */
function generateOrderNumber(): string {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `JA-${ymd}-${rand}`;
}

/** Validate a coupon against the current cart subtotal. */
export async function validateCoupon(code: string, subtotal: number) {
  const insforge = await createClient();
  const clean = code.trim().toUpperCase();
  if (!clean) return { error: "Enter a coupon code" };

  const { data: coupon } = await insforge.database
    .from("coupons")
    .select("*")
    .eq("code", clean)
    .eq("is_active", true)
    .maybeSingle();

  if (!coupon) return { error: "Invalid or inactive coupon" };
  const c = coupon as Coupon;

  if (c.expires_at && new Date(c.expires_at) < new Date()) {
    return { error: "This coupon has expired" };
  }
  if (c.usage_limit != null && c.used_count >= c.usage_limit) {
    return { error: "This coupon has reached its usage limit" };
  }
  if (subtotal < c.min_order_amount) {
    return {
      error: `Minimum order of ₹${c.min_order_amount} required for this coupon`,
    };
  }

  const discount = computeDiscount(c, subtotal);
  return { success: "Coupon applied", code: c.code, discount };
}

export async function placeOrder(_prev: unknown, formData: FormData) {
  const insforge = await createClient();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const addressId = formData.get("address_id") as string;
  const couponCode = (formData.get("coupon_code") as string) || null;
  const paymentMethod = (formData.get("payment_method") as string) || "cod";

  if (!addressId) return { error: "Please select a delivery address" };

  // Load address
  const { data: address } = await insforge.database
    .from("addresses")
    .select("*")
    .eq("id", addressId)
    .eq("user_id", user.id)
    .single();
  if (!address) return { error: "Invalid address" };
  const addr = address as {
    full_name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
  };

  // Load cart with products
  const { data: cart } = await insforge.database
    .from("cart_items")
    .select("*, product:products(*)")
    .eq("user_id", user.id);

  const items = ((cart ?? []) as CartItemWithProduct[]).filter(
    (it) => it.product
  );
  if (items.length === 0) return { error: "Your cart is empty" };

  const subtotal = items.reduce(
    (sum, it) => sum + it.product.mrp * it.quantity,
    0
  );

  // Re-validate coupon server-side
  let discount = 0;
  let appliedCode: string | null = null;
  if (couponCode) {
    const res = await validateCoupon(couponCode, subtotal);
    if (!res.error && res.discount) {
      discount = res.discount;
      appliedCode = res.code ?? null;
    }
  }

  const shipping = computeShipping(subtotal);
  const total = Math.max(0, subtotal - discount) + shipping;

  // Razorpay is not configured backend-side yet, so all orders are placed as
  // Cash on Delivery. When Razorpay keys are configured (see checkout note),
  // wire insforge.payments.razorpay.createOrder() here and drive Checkout.js
  // on the client; fulfillment must come from verified payments.webhook_events
  // rows, not from this success path.
  const effectivePaymentMethod = paymentMethod === "razorpay" ? "cod" : paymentMethod;

  // Create order
  const { data: order, error: orderErr } = await insforge.database
    .from("orders")
    .insert([
      {
        order_number: generateOrderNumber(),
        user_id: user.id,
        subtotal,
        discount,
        shipping_fee: shipping,
        total,
        coupon_code: appliedCode,
        shipping_name: addr.full_name,
        shipping_phone: addr.phone,
        shipping_line1: addr.line1,
        shipping_line2: addr.line2,
        shipping_city: addr.city,
        shipping_state: addr.state,
        shipping_pincode: addr.pincode,
        payment_method: effectivePaymentMethod,
        status: "pending",
      },
    ])
    .select("id, order_number")
    .single();
  if (orderErr || !order) return { error: orderErr?.message || "Order failed" };
  const createdOrder = order as { id: string; order_number: string };

  // Insert order items (snapshot)
  const orderItems = items.map((it) => ({
    order_id: createdOrder.id,
    product_id: it.product.id,
    product_name: it.product.name,
    drug_code: it.product.drug_code,
    unit_price: it.product.mrp,
    quantity: it.quantity,
  }));
  const { error: itemsErr } = await insforge.database
    .from("order_items")
    .insert(orderItems);
  if (itemsErr) return { error: itemsErr.message };

  // Increment coupon usage
  if (appliedCode) {
    const { data: c } = await insforge.database
      .from("coupons")
      .select("id, used_count")
      .eq("code", appliedCode)
      .maybeSingle();
    if (c) {
      const cr = c as { id: string; used_count: number };
      await insforge.database
        .from("coupons")
        .update({ used_count: cr.used_count + 1 })
        .eq("id", cr.id);
    }
  }

  // Clear cart
  await insforge.database.from("cart_items").delete().eq("user_id", user.id);

  revalidatePath("/account/orders");
  redirect(`/order-confirmation/${createdOrder.id}`);
}
