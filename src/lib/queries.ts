import {
  dbGetCategories,
  dbGetCategoryBySlug,
  dbGetCategoriesWithCount,
  dbGetProducts,
  dbGetFeaturedProducts,
  dbGetProductBySlug,
  dbGetRelatedProducts,
  dbGetWishlistProductIds,
} from "@/lib/db/repository";
import { getSessionUser } from "@/lib/db/auth-stub";
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
  const { data } = await dbGetCategories();
  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data } = await dbGetCategoryBySlug(slug);
  return data ?? null;
}

export async function getCategoriesWithCount() {
  const { data } = await dbGetCategoriesWithCount();
  return data ?? [];
}

export async function getProducts(query: ProductQuery) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.pageSize ?? PAGE_SIZE;

  let categoryId: string | undefined;
  if (query.category) {
    const cat = await getCategoryBySlug(query.category);
    categoryId = cat?.id;
  }

  const { data, count } = await dbGetProducts({
    q: query.q,
    categoryId,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sort: query.sort,
    featured: query.featured,
    excludeOnRequest: query.excludeOnRequest,
    page,
    pageSize,
  });

  const total = count ?? 0;
  return {
    products: (data ?? []) as Product[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { data } = await dbGetFeaturedProducts(limit);
  return (data ?? []) as Product[];
}

export async function getProductBySlug(slug: string) {
  const { data } = await dbGetProductBySlug(slug);
  return data;
}

export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 4
): Promise<Product[]> {
  const { data } = await dbGetRelatedProducts(categoryId, excludeId, limit);
  return (data ?? []) as Product[];
}

export async function getWishlistIds(): Promise<Set<string>> {
  const user = await getSessionUser();
  if (!user) return new Set();
  const { data } = await dbGetWishlistProductIds(user.id);
  return new Set((data ?? []).map((r) => r.product_id));
}
