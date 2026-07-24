import { getSessionUser } from "@/lib/db/auth-stub";
import { dbGetProductReviews } from "@/lib/db/repository";
import type { Review } from "@/lib/types";

export interface ProductReviews {
  reviews: (Review & { author: string })[];
  average: number;
  count: number;
  userReview: Review | null;
}

export async function getProductReviews(productId: string): Promise<ProductReviews> {
  const user = await getSessionUser();
  const { data } = await dbGetProductReviews(productId);
  const rows = data ?? [];

  const reviews = rows.map((r) => ({
    id: r.id,
    product_id: r.product_id,
    user_id: r.user_id,
    rating: r.rating,
    title: r.title ?? null,
    comment: r.comment ?? null,
    created_at: String(r.created_at),
    author: (r.profile as { full_name: string | null } | null)?.full_name || "Anonymous",
  }));

  const count = reviews.length;
  const average = count === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / count;
  const userReview = user ? reviews.find((r) => r.user_id === user.id) ?? null : null;

  return { reviews, average, count, userReview };
}
