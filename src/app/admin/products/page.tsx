import type { Metadata } from "next";
import { ProductsManager } from "@/components/admin/products-manager";
import { Pagination } from "@/components/storefront/pagination";
import { createClient } from "@/lib/insforge/server";
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
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const insforge = await createClient();

  let builder = insforge.database
    .from("products")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  if (sp.q) builder = builder.ilike("name", `%${sp.q}%`);

  const [{ data, count }, { data: cats }] = await Promise.all([
    builder.range(from, to),
    insforge.database.from("categories").select("*").order("name"),
  ]);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <ProductsManager
        products={(data ?? []) as Product[]}
        categories={(cats ?? []) as Category[]}
        total={count ?? 0}
      />
      <Pagination
        page={page}
        totalPages={totalPages}
        baseParams={{ q: sp.q }}
      />
    </div>
  );
}
