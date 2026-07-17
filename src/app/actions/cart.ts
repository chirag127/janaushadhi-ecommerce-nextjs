"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/insforge/server";

async function requireUser() {
  const insforge = await createClient();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();
  return { insforge, user };
}

export async function addToCart(productId: string, quantity = 1) {
  const { insforge, user } = await requireUser();
  if (!user) return { error: "Please sign in to add items to your cart." };

  // Upsert: increment quantity if it already exists.
  const { data: existing } = await insforge.database
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const row = existing as { id: string; quantity: number };
    const { error } = await insforge.database
      .from("cart_items")
      .update({ quantity: row.quantity + quantity })
      .eq("id", row.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await insforge.database
      .from("cart_items")
      .insert([{ user_id: user.id, product_id: productId, quantity }]);
    if (error) return { error: error.message };
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: "Added to cart" };
}

export async function updateCartQuantity(itemId: string, quantity: number) {
  const { insforge, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };

  if (quantity <= 0) return removeFromCart(itemId);

  const { error } = await insforge.database
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/cart");
  return { success: "Updated" };
}

export async function removeFromCart(itemId: string) {
  const { insforge, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await insforge.database
    .from("cart_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: "Removed" };
}

export async function clearCart() {
  const { insforge, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await insforge.database
    .from("cart_items")
    .delete()
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/cart");
  return { success: "Cleared" };
}
