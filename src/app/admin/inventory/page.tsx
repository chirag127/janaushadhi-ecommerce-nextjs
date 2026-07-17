import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/storefront/pagination";
import { InventoryManager } from "@/components/admin/inventory-manager";
import { createClient } from "@/lib/insforge/server";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Inventory" };

const PAGE_SIZE = 25;
type SearchParams = Promise<{ filter?: string; page?: string }>;

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const insforge = await createClient();
  let builder = insforge.database
    .from("products")
    .select("*", { count: "exact" })
    .order("stock", { ascending: true });

  if (sp.filter === "low") builder = builder.lte("stock", 10).gt("stock", 0);
  if (sp.filter === "out") builder = builder.lte("stock", 0);

  const { data, count } = await builder.range(from, to);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventory</h1>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant={!sp.filter ? "default" : "outline"} size="sm">
          <Link href="/admin/inventory">All</Link>
        </Button>
        <Button
          asChild
          variant={sp.filter === "low" ? "default" : "outline"}
          size="sm"
        >
          <Link href="/admin/inventory?filter=low">Low stock</Link>
        </Button>
        <Button
          asChild
          variant={sp.filter === "out" ? "default" : "outline"}
          size="sm"
        >
          <Link href="/admin/inventory?filter=out">Out of stock</Link>
        </Button>
      </div>

      <InventoryManager products={(data ?? []) as Product[]} />

      <Pagination
        page={page}
        totalPages={totalPages}
        baseParams={{ filter: sp.filter }}
      />
    </div>
  );
}
