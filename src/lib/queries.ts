import { createClient } from "@/lib/insforge/server";
import { PAGE_SIZE } from "@/lib/utils";
import type { Category, Product } from "@/lib/types";

export interface ProductQuery {
  q?: string;
  category?: string; // category slug
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "name";
  featured?: boolean;
  excludeOnRequest?: boolean;
  page?: number;
  pageSize?: number;
}

export async function getCategories(): Promise<Category[]> {
  const insforge = await createClient();
  const { data } = await insforge.database
    .from("categories")
    .select("*")
    .order("sort_order")
    .order("name");
  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const insforge = await createClient();
  const { data } = await insforge.database
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Category) ?? null;
}

export async function getCategoriesWithCount(): Promise<
  (Category & { product_count: number })[]
> {
  const insforge = await createClient();
  const { data: cats } = await insforge.database
    .from("categories")
    .select("*")
    .order("sort_order")
    .order("name");

  const categories = (cats ?? []) as Category[];
  const results = await Promise.all(
    categories.map(async (c) => {
      const { count } = await insforge.database
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category_id", c.id)
        .eq("is_active", true);
      return { ...c, product_count: count ?? 0 };
    })
  );
  return results;
}

export async function getProducts(query: ProductQuery) {
  const insforge = await createClient();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let builder = insforge.database
    .from("products")
    .select("*, category:categories(id, name, slug)", { count: "exact" })
    .eq("is_active", true);

  if (query.q) {
    const term = query.q.replace(/[%,]/g, " ").trim();
    builder = builder.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }
  if (query.featured) builder = builder.eq("is_featured", true);
  if (typeof query.minPrice === "number")
    builder = builder.gte("mrp", query.minPrice);
  if (typeof query.maxPrice === "number")
    builder = builder.lte("mrp", query.maxPrice);
  if (query.excludeOnRequest) builder = builder.gt("price", 0);

  if (query.category) {
    const cat = await getCategoryBySlug(query.category);
    if (cat) builder = builder.eq("category_id", cat.id);
  }

  switch (query.sort) {
    case "price_asc":
      builder = builder.order("mrp", { ascending: true });
      break;
    case "price_desc":
      builder = builder.order("mrp", { ascending: false });
      break;
    case "name":
      builder = builder.order("name", { ascending: true });
      break;
    default:
      builder = builder.order("created_at", { ascending: false });
  }

  const { data, count } = await builder.range(from, to);
  return {
    products: (data ?? []) as Product[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const insforge = await createClient();
  const { data } = await insforge.database
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .gt("mrp", 0)
    .limit(limit);

  if (data && data.length > 0) return data as Product[];

  // Fallback: show some affordable in-stock products
  const { data: fallback } = await insforge.database
    .from("products")
    .select("*")
    .eq("is_active", true)
    .gt("mrp", 0)
    .order("created_at", { ascending: true })
    .limit(limit);
  return (fallback ?? []) as Product[];
}

export async function getProductBySlug(slug: string) {
  const insforge = await createClient();
  const { data } = await insforge.database
    .from("products")
    .select("*, category:categories(id, name, slug)")
    .eq("slug", slug)
    .maybeSingle();
  return data as (Product & { category: Category | null }) | null;
}

export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 4
): Promise<Product[]> {
  if (!categoryId) return [];
  const insforge = await createClient();
  const { data } = await insforge.database
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .neq("id", excludeId)
    .limit(limit);
  return (data ?? []) as Product[];
}

/** Set of product IDs in the current user's wishlist (for card state). */
export async function getWishlistIds(): Promise<Set<string>> {
  const insforge = await createClient();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();
  if (!user) return new Set();
  const { data } = await insforge.database
    .from("wishlist_items")
    .select("product_id")
    .eq("user_id", user.id);
  return new Set(
    ((data ?? []) as { product_id: string }[]).map((r) => r.product_id)
  );
}
