"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { computeShipping } from "@/lib/utils";
import type { CartItemWithProduct, Coupon } from "@/lib/types";

function computeDiscount(coupon: Coupon, subtotal: number): number {
  if (subtotal < coupon.min_order_amount) return 0;
  let d =
    coupon.discount_type === "percent"
      ? (subtotal * coupon.discount_value) / 100
      : coupon.discount_value;
  if (coupon.max_discount_amount != null)
    d = Math.min(d, coupon.max_discount_amount);
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

  // Resolve the applied coupon id (schema stores coupon_id, not a code string).
  let couponId: string | null = null;
  if (appliedCode) {
    const { data: cRow } = await insforge.database
      .from("coupons")
      .select("id")
      .eq("code", appliedCode)
      .maybeSingle();
    couponId = (cRow as { id: string } | null)?.id ?? null;
  }

  // Razorpay is not configured backend-side yet (placeholder keys), so all
  // orders are finalized as Cash on Delivery. When Razorpay keys are set via
  // `npx @insforge/cli payments razorpay config set`, wire
  // insforge.payments.razorpay.createOrder() here and drive Checkout.js on the
  // client; fulfillment must then come from verified webhook events, not this
  // success path. The chosen method is snapshotted into shipping_address jsonb
  // (matching the shared backend used by the sibling storefronts).
  const chosenMethod: "cod" | "razorpay" =
    paymentMethod === "cod" ? "cod" : "razorpay";

  // Create order — jsonb shipping_address holds the address snapshot + method.
  const { data: order, error: orderErr } = await insforge.database
    .from("orders")
    .insert([
      {
        order_number: generateOrderNumber(),
        user_id: user.id,
        status: "processing",
        payment_status: "pending",
        subtotal,
        discount,
        shipping,
        total,
        currency: "INR",
        coupon_id: couponId,
        shipping_address: {
          full_name: addr.full_name,
          phone: addr.phone,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          country: "India",
          _payment_method: chosenMethod,
        },
        is_test_payment: false,
      },
    ])
    .select("id, order_number")
    .single();
  if (orderErr || !order) return { error: orderErr?.message || "Order failed" };
  const createdOrder = order as { id: string; order_number: string };

  // Insert order items (snapshot). Jan Aushadhi sells at MRP → unit = mrp.
  const orderItems = items.map((it) => ({
    order_id: createdOrder.id,
    product_id: it.product.id,
    product_name: it.product.name,
    unit_price: it.product.mrp,
    quantity: it.quantity,
    line_total: it.product.mrp * it.quantity,
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
