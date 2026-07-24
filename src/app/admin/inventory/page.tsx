import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/storefront/pagination";
import { InventoryManager } from "@/components/admin/inventory-manager";
import { dbGetInventory } from "@/lib/db/repository";
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

  const { data, count } = await dbGetInventory({
    filter: sp.filter,
    page,
    pageSize: PAGE_SIZE,
  });
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

      <Pagination page={page} totalPages={totalPages} baseParams={{ filter: sp.filter }} />
    </div>
  );
}
