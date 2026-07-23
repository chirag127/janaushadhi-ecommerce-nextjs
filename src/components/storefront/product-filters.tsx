"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Category } from "@/lib/types";

export function ProductFilters({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [minPrice, setMinPrice] = React.useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = React.useState(params.get("maxPrice") ?? "");
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const currentCategory = params.get("category") ?? "";
  const currentSort = params.get("sort") ?? "newest";

  function update(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    sp.delete("page");
    router.push(`/products?${sp.toString()}`);
  }

  function applyPrice(e: React.FormEvent) {
    e.preventDefault();
    update({ minPrice: minPrice || undefined, maxPrice: maxPrice || undefined });
    setMobileOpen(false);
  }

  function clearAll() {
    setMinPrice("");
    setMaxPrice("");
    const q = params.get("q");
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  const content = (
    <div className="space-y-6">
      <div>
        <Label className="mb-2 block">Sort by</Label>
        <Select
          value={currentSort}
          onChange={(e) => update({ sort: e.target.value })}
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name">Name (A–Z)</option>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block">Category</Label>
        <Select
          value={currentCategory}
          onChange={(e) => update({ category: e.target.value || undefined })}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <form onSubmit={applyPrice}>
        <Label className="mb-2 block">Price range (₹)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" className="mt-2 w-full">
          Apply
        </Button>
      </form>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={params.get("onRequest") === "0"}
          onChange={(e) =>
            update({ onRequest: e.target.checked ? "0" : undefined })
          }
        />
        <span>Exclude &quot;on request&quot; items</span>
      </label>

      <Button variant="outline" size="sm" className="w-full" onClick={clearAll}>
        Clear filters
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="mb-4 lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen((o) => !o)}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </Button>
      </div>
      {mobileOpen && (
        <div className="mb-6 rounded-lg border p-4 lg:hidden">{content}</div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-lg border p-5">{content}</div>
      </aside>
    </>
  );
}
