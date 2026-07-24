"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/db/auth-stub";
import {
  dbGetCartItem,
  dbAddToCart,
  dbUpdateCartQuantity,
  dbRemoveFromCart,
  dbClearCart,
} from "@/lib/db/repository";

async function requireUser() {
  return getSessionUser();
}

export async function addToCart(productId: string, quantity = 1) {
  const user = await requireUser();
  if (!user) return { error: "Please sign in to add items to your cart." };

  const { data: existing, error: fetchErr } = await dbGetCartItem(user.id, productId);
  if (fetchErr) return { error: fetchErr.message };

  if (existing) {
    const { error } = await dbUpdateCartQuantity(existing.id, user.id, existing.quantity + quantity);
    if (error) return { error: error.message };
  } else {
    const { error } = await dbAddToCart(user.id, productId, quantity);
    if (error) return { error: error.message };
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: "Added to cart" };
}

export async function updateCartQuantity(itemId: string, quantity: number) {
  const user = await requireUser();
  if (!user) return { error: "Not authenticated" };
  if (quantity <= 0) return removeFromCart(itemId);

  const { error } = await dbUpdateCartQuantity(itemId, user.id, quantity);
  if (error) return { error: error.message };

  revalidatePath("/cart");
  return { success: "Updated" };
}

export async function removeFromCart(itemId: string) {
  const user = await requireUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await dbRemoveFromCart(itemId, user.id);
  if (error) return { error: error.message };

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: "Removed" };
}

export async function clearCart() {
  const user = await requireUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await dbClearCart(user.id);
  if (error) return { error: error.message };

  revalidatePath("/cart");
  return { success: "Cleared" };
}
