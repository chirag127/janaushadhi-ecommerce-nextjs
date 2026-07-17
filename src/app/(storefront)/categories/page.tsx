import type { Metadata } from "next";
import Link from "next/link";
import { Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCategoriesWithCount } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse generic medicines by therapy area and category.",
};

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCount();

  return (
    <div className="container py-8">
      <h1 className="mb-2 text-2xl font-bold">Categories</h1>
      <p className="mb-6 text-muted-foreground">
        Explore products by category
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <Link key={c.id} href={`/products?category=${c.slug}`}>
            <Card className="flex h-full flex-col gap-3 p-5 transition-colors hover:border-primary">
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Tag className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-semibold">{c.name}</h2>
                {c.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {c.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.product_count} products
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
