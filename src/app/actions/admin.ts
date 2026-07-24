"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/db/auth-stub";
import {
  dbGetProfile,
  dbUpsertProduct,
  dbDeleteProduct,
  dbUpdateStock,
  dbUpsertCategory,
  dbDeleteCategory,
  dbUpdateOrderStatus,
  dbUpsertCoupon,
  dbDeleteCoupon,
  dbUpdateProfile,
} from "@/lib/db/repository";
import {
  productSchema,
  categorySchema,
  couponSchema,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

async function assertAdmin() {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  const { data } = await dbGetProfile(user.id);
  return { ok: (data?.role === "admin") as boolean };
}

// ---- Products ---------------------------------------------------------------
export async function upsertProduct(_prev: unknown, formData: FormData) {
  const { ok } = await assertAdmin();
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
  const { error } = await dbUpsertProduct({
    id,
    drug_code: parsed.data.drug_code,
    name: parsed.data.name,
    slug: `${slugify(parsed.data.name)}-${parsed.data.drug_code}`,
    unit_size: parsed.data.unit_size || null,
    mrp: parsed.data.mrp,
    price: parsed.data.mrp,
    category_id: parsed.data.category_id || null,
    description: parsed.data.description || null,
    image_url: parsed.data.image_url || null,
    stock: parsed.data.stock,
    is_featured: parsed.data.is_featured ?? false,
    is_active: parsed.data.is_active ?? true,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: "Product saved" };
}

export async function deleteProduct(id: string) {
  const { ok } = await assertAdmin();
  if (!ok) return { error: "Not authorized" };
  const { error } = await dbDeleteProduct(id);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  return { success: "Product deleted" };
}

export async function updateStock(id: string, stock: number) {
  const { ok } = await assertAdmin();
  if (!ok) return { error: "Not authorized" };
  const { error } = await dbUpdateStock(id, stock);
  if (error) return { error: error.message };
  revalidatePath("/admin/inventory");
  return { success: "Stock updated" };
}

// ---- Categories -------------------------------------------------------------
export async function upsertCategory(_prev: unknown, formData: FormData) {
  const { ok } = await assertAdmin();
  if (!ok) return { error: "Not authorized" };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const id = formData.get("id") as string | null;
  const { error } = await dbUpsertCategory({
    id,
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { success: "Category saved" };
}

export async function deleteCategory(id: string) {
  const { ok } = await assertAdmin();
  if (!ok) return { error: "Not authorized" };
  const { error } = await dbDeleteCategory(id);
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return { success: "Category deleted" };
}

// ---- Orders -----------------------------------------------------------------
export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { ok } = await assertAdmin();
  if (!ok) return { error: "Not authorized" };
  const { error } = await dbUpdateOrderStatus(id, status);
  if (error) return { error: error.message };
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { success: "Order updated" };
}

// ---- Coupons ----------------------------------------------------------------
export async function upsertCoupon(_prev: unknown, formData: FormData) {
  const { ok } = await assertAdmin();
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
  const { error } = await dbUpsertCoupon({
    id,
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
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/coupons");
  return { success: "Coupon saved" };
}

export async function deleteCoupon(id: string) {
  const { ok } = await assertAdmin();
  if (!ok) return { error: "Not authorized" };
  const { error } = await dbDeleteCoupon(id);
  if (error) return { error: error.message };
  revalidatePath("/admin/coupons");
  return { success: "Coupon deleted" };
}

// ---- Profile ----------------------------------------------------------------
export async function updateProfile(
  _prev: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const fullName = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (fullName.length < 2) return { error: "Please enter your full name" };

  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await dbUpdateProfile(user.id, {
    full_name: fullName,
    phone: phone || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/account", "layout");
  return { success: "Profile updated" };
}
