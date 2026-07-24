"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/db/auth-stub";
import {
  dbGetWishlistItem,
  dbAddToWishlist,
  dbRemoveFromWishlist,
} from "@/lib/db/repository";

export async function toggleWishlist(productId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in to use your wishlist." };

  const { data: existing, error: fetchErr } = await dbGetWishlistItem(user.id, productId);
  if (fetchErr) return { error: fetchErr.message };

  if (existing) {
    const { error } = await dbRemoveFromWishlist(existing.id, user.id);
    if (error) return { error: error.message };
    revalidatePath("/account/wishlist");
    return { success: "Removed from wishlist", inWishlist: false };
  }

  const { error } = await dbAddToWishlist(user.id, productId);
  if (error) return { error: error.message };

  revalidatePath("/account/wishlist");
  return { success: "Added to wishlist", inWishlist: true };
}

export async function removeFromWishlist(itemId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await dbRemoveFromWishlist(itemId, user.id);
  if (error) return { error: error.message };

  revalidatePath("/account/wishlist");
  return { success: "Removed" };
}
