import type { Metadata } from "next";
import { ProductsManager } from "@/components/admin/products-manager";
import { Pagination } from "@/components/storefront/pagination";
import { dbGetProductsForAdmin, dbGetCategories } from "@/lib/db/repository";
import type { Category, Product } from "@/lib/types";

export const metadata: Metadata = { title: "Manage Products" };

const PAGE_SIZE = 20;
type SearchParams = Promise<{ q?: string; page?: string }>;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;

  const [productsRes, catsRes] = await Promise.all([
    dbGetProductsForAdmin({ q: sp.q, page, pageSize: PAGE_SIZE }),
    dbGetCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil((productsRes.count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <ProductsManager
        products={(productsRes.data ?? []) as Product[]}
        categories={(catsRes.data ?? []) as Category[]}
        total={productsRes.count ?? 0}
      />
      <Pagination page={page} totalPages={totalPages} baseParams={{ q: sp.q }} />
    </div>
  );
}
