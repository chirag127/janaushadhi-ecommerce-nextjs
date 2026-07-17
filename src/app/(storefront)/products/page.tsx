import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductFilters } from "@/components/storefront/product-filters";
import { Pagination } from "@/components/storefront/pagination";
import {
  getProducts,
  getCategories,
  getWishlistIds,
} from "@/lib/queries";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Browse thousands of affordable generic medicines and health products.",
};

type SearchParams = Promise<{
  q?: string;
  category?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  featured?: string;
  page?: string;
}>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;

  const [{ products, total, totalPages }, categories, wishlist, user] =
    await Promise.all([
      getProducts({
        q: sp.q,
        category: sp.category,
        sort: (sp.sort as "newest") ?? "newest",
        minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
        maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
        featured: sp.featured === "1",
        page,
      }),
      getCategories(),
      getWishlistIds(),
      getUser(),
    ]);

  const isAuthed = !!user;
  const heading = sp.q
    ? `Search results for “${sp.q}”`
    : sp.featured === "1"
    ? "Featured Products"
    : "All Products";

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{heading}</h1>
        <p className="text-sm text-muted-foreground">{total} products found</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <ProductFilters categories={categories} />

        <div>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border py-20 text-center">
              <PackageSearch className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="font-medium">No products found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    isAuthed={isAuthed}
                    inWishlist={wishlist.has(p.id)}
                  />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                baseParams={{
                  q: sp.q,
                  category: sp.category,
                  sort: sp.sort,
                  minPrice: sp.minPrice,
                  maxPrice: sp.maxPrice,
                  featured: sp.featured,
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
