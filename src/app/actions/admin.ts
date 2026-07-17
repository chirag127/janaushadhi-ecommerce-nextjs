"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/insforge/server";
import {
  productSchema,
  categorySchema,
  couponSchema,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

async function assertAdmin() {
  const insforge = await createClient();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();
  if (!user) return { insforge, ok: false as const };
  const { data } = await insforge.database
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return { insforge, ok: (data as { role?: string } | null)?.role === "admin" };
}

// ---- Products ---------------------------------------------------------------
export async function upsertProduct(_prev: unknown, formData: FormData) {
  const { insforge, ok } = await assertAdmin();
  if (!ok) return { error: "Not authorized" };

  const parsed = productSchema.safeParse({
    drug_code: formData.get("drug_code"),
    name: formData.get("name"),
    unit_size: formData.get("unit_size") || undefined,
    mrp: formData.get("mrp"),
    category_id: formData.get("category_id") || "",
    description: formData.get("description") || undefined,
    image_url: formData.get("image_url") || "",
    stock: formData.get("stock"),
    is_featured: formData.get("is_featured") === "on",
    is_active: formData.get("is_active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const id = formData.get("id") as string | null;
  const payload = {
    drug_code: parsed.data.drug_code,
    name: parsed.data.name,
    slug: `${slugify(parsed.data.name)}-${parsed.data.drug_code}`,
    unit_size: parsed.data.unit_size || null,
    mrp: parsed.data.mrp,
    // Jan Aushadhi sells at MRP — keep price aligned with MRP.
    price: parsed.data.mrp,
    category_id: parsed.data.category_id || null,
    description: parsed.data.description || null,
    image_url: parsed.data.image_url || null,
    stock: parsed.data.stock,
    is_featured: parsed.data.is_featured ?? false,
    is_active: parsed.data.is_active ?? true,
  };

  if (id) {
    const { error } = await insforge.database
      .from("products")
      .update(payload)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await insforge.database.from("products").insert([payload]);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: "Product saved" };
}

export async function deleteProduct(id: string) {
  const { insforge, ok } = await assertAdmin();
  if (!ok) return { error: "Not authorized" };
  const { error } = await insforge.database.from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  return { success: "Product deleted" };
}

export async function updateStock(id: string, stock: number) {
  const { insforge, ok } = await assertAdmin();
  if (!ok) return { error: "Not authorized" };
  const { error } = await insforge.database
    .from("products")
    .update({ stock })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/inventory");
  return { success: "Stock updated" };
}

// ---- Categories -------------------------------------------------------------
export async function upsertCategory(_prev: unknown, formData: FormData) {
  const { insforge, ok } = await assertAdmin();
  if (!ok) return { error: "Not authorized" };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const id = formData.get("id") as string | null;
  const payload = {
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description || null,
  };

  if (id) {
    const { error } = await insforge.database
      .from("categories")
      .update(payload)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await insforge.database.from("categories").insert([payload]);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { success: "Category saved" };
}

export async function deleteCategory(id: string) {
  const { insforge, ok } = await assertAdmin();
  if (!ok) return { error: "Not authorized" };
  const { error } = await insforge.database.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return { success: "Category deleted" };
}

// ---- Orders -----------------------------------------------------------------
export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { insforge, ok } = await assertAdmin();
  if (!ok) return { error: "Not authorized" };
  const { error } = await insforge.database
    .from("orders")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { success: "Order updated" };
}

// ---- Coupons ----------------------------------------------------------------
export async function upsertCoupon(_prev: unknown, formData: FormData) {
  const { insforge, ok } = await assertAdmin();
  if (!ok) return { error: "Not authorized" };

  const parsed = couponSchema.safeParse({
    code: formData.get("code"),
    discount_type: formData.get("discount_type"),
    discount_value: formData.get("discount_value"),
    min_order_amount: formData.get("min_order_amount") || 0,
    max_discount_amount: formData.get("max_discount_amount") || undefined,
    usage_limit: formData.get("usage_limit") || undefined,
    expires_at: formData.get("expires_at") || undefined,
    is_active: formData.get("is_active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const id = formData.get("id") as string | null;
  const payload = {
    code: parsed.data.code,
    discount_type: parsed.data.discount_type,
    discount_value: parsed.data.discount_value,
    min_order_amount: parsed.data.min_order_amount,
    max_discount_amount: parsed.data.max_discount_amount ?? null,
    usage_limit: parsed.data.usage_limit ?? null,
    expires_at: parsed.data.expires_at
      ? new Date(parsed.data.expires_at).toISOString()
      : null,
    is_active: parsed.data.is_active ?? true,
  };

  if (id) {
    const { error } = await insforge.database
      .from("coupons")
      .update(payload)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await insforge.database.from("coupons").insert([payload]);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/coupons");
  return { success: "Coupon saved" };
}

export async function deleteCoupon(id: string) {
  const { insforge, ok } = await assertAdmin();
  if (!ok) return { error: "Not authorized" };
  const { error } = await insforge.database.from("coupons").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/coupons");
  return { success: "Coupon deleted" };
}
