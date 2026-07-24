"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/db/auth-stub";
import {
  dbGetAddress,
  dbGetCart,
  dbGetCouponByCode,
  dbGetCouponIdByCode,
  dbIncrementCouponUsage,
  dbCreateOrder,
  dbCreateOrderItems,
  dbClearCart,
} from "@/lib/db/repository";
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

function generateOrderNumber(): string {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `JA-${ymd}-${rand}`;
}

export async function validateCoupon(code: string, subtotal: number) {
  const clean = code.trim().toUpperCase();
  if (!clean) return { error: "Enter a coupon code" };

  const { data: coupon, error } = await dbGetCouponByCode(clean);
  if (error || !coupon) return { error: "Invalid or inactive coupon" };

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { error: "This coupon has expired" };
  }
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
    return { error: "This coupon has reached its usage limit" };
  }
  if (subtotal < coupon.min_order_amount) {
    return {
      error: `Minimum order of ₹${coupon.min_order_amount} required for this coupon`,
    };
  }

  const discount = computeDiscount(coupon, subtotal);
  return { success: "Coupon applied", code: coupon.code, discount };
}

export async function placeOrder(_prev: unknown, formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const addressId = formData.get("address_id") as string;
  const couponCode = (formData.get("coupon_code") as string) || null;
  const paymentMethod = (formData.get("payment_method") as string) || "cod";

  if (!addressId) return { error: "Please select a delivery address" };

  const { data: address, error: addrErr } = await dbGetAddress(addressId, user.id);
  if (addrErr || !address) return { error: "Invalid address" };

  const { data: cartItems, error: cartErr } = await dbGetCart(user.id);
  if (cartErr) return { error: cartErr.message };

  const items = (cartItems ?? []).filter((it) => it.product) as CartItemWithProduct[];
  if (items.length === 0) return { error: "Your cart is empty" };

  const onRequestItem = items.find((it) => !it.product.price || it.product.price <= 0);
  if (onRequestItem) {
    return {
      error: `${onRequestItem.product.name} is available on request only — please contact us to order it.`,
    };
  }

  const subtotal = items.reduce((sum, it) => sum + it.product.mrp * it.quantity, 0);

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

  let couponId: string | null = null;
  if (appliedCode) {
    const { data: cRow } = await dbGetCouponIdByCode(appliedCode);
    couponId = cRow?.id ?? null;
  }

  const chosenMethod: "cod" | "razorpay" = paymentMethod === "cod" ? "cod" : "razorpay";

  const { data: order, error: orderErr } = await dbCreateOrder({
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
      full_name: address.full_name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? null,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: "India",
      _payment_method: chosenMethod,
    },
    is_test_payment: false,
  });
  if (orderErr || !order) return { error: orderErr?.message || "Order failed" };

  const { error: itemsErr } = await dbCreateOrderItems(
    items.map((it) => ({
      order_id: order.id,
      product_id: it.product.id,
      product_name: it.product.name,
      unit_price: it.product.mrp,
      quantity: it.quantity,
      line_total: it.product.mrp * it.quantity,
    }))
  );
  if (itemsErr) return { error: itemsErr.message };

  if (appliedCode) {
    const { data: c } = await dbGetCouponIdByCode(appliedCode);
    if (c) await dbIncrementCouponUsage(c.id, c.used_count);
  }

  await dbClearCart(user.id);

  revalidatePath("/account/orders");
  redirect(`/order-confirmation/${order.id}`);
}
