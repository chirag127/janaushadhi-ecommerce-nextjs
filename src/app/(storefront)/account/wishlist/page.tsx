import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/storefront/product-card";
import { createClient } from "@/lib/insforge/server";
import { getUser } from "@/lib/auth";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false },
};

export default async function WishlistPage() {
  const user = await getUser();
  const insforge = await createClient();
  const { data } = await insforge.database
    .from("wishlist_items")
    .select("product:products(*)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const products = ((data ?? []) as unknown as { product: Product | null }[])
    .map((r) => r.product)
    .filter((p): p is Product => !!p && p.is_active);

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <Heart className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="font-medium">Your wishlist is empty</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Save products you love to find them easily later.
          </p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Your Wishlist</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} isAuthed inWishlist />
        ))}
      </div>
    </div>
  );
}
