import { createClient } from "@/lib/insforge/server";
import type { Review } from "@/lib/types";

export interface ProductReviews {
  reviews: (Review & { author: string })[];
  average: number;
  count: number;
  userReview: Review | null;
}

export async function getProductReviews(
  productId: string
): Promise<ProductReviews> {
  const insforge = await createClient();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();

  const { data } = await insforge.database
    .from("reviews")
    .select("*, profile:profiles(full_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as (Review & {
    profile: { full_name: string | null } | null;
  })[];

  const reviews = rows.map((r) => ({
    ...r,
    author: r.profile?.full_name || "Anonymous",
  }));
  const count = reviews.length;
  const average =
    count === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / count;
  const userReview = user
    ? reviews.find((r) => r.user_id === user.id) ?? null
    : null;

  return { reviews, average, count, userReview };
}
