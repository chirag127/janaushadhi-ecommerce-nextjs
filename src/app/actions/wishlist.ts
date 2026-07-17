"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/insforge/server";

export async function toggleWishlist(productId: string) {
  const insforge = await createClient();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();
  if (!user) return { error: "Please sign in to use your wishlist." };

  const { data: existing } = await insforge.database
    .from("wishlist_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await insforge.database
      .from("wishlist_items")
      .delete()
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: error.message };
    revalidatePath("/account/wishlist");
    return { success: "Removed from wishlist", inWishlist: false };
  }

  const { error } = await insforge.database
    .from("wishlist_items")
    .insert([{ user_id: user.id, product_id: productId }]);
  if (error) return { error: error.message };

  revalidatePath("/account/wishlist");
  return { success: "Added to wishlist", inWishlist: true };
}

export async function removeFromWishlist(itemId: string) {
  const insforge = await createClient();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await insforge.database
    .from("wishlist_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/account/wishlist");
  return { success: "Removed" };
}
