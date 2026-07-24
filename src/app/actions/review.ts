"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/db/auth-stub";
import { dbUpsertReview, dbDeleteReview } from "@/lib/db/repository";
import { reviewSchema } from "@/lib/validations";

export async function submitReview(_prev: unknown, formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in to leave a review." };

  const parsed = reviewSchema.safeParse({
    product_id: formData.get("product_id"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { error } = await dbUpsertReview({
    product_id: parsed.data.product_id,
    user_id: user.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/products");
  return { success: "Review submitted. Thank you!" };
}

export async function deleteReview(reviewId: string, productSlug: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await dbDeleteReview(reviewId, user.id);
  if (error) return { error: error.message };

  revalidatePath(`/products/${productSlug}`);
  return { success: "Review deleted" };
}
