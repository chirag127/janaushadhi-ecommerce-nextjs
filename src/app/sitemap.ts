import type { MetadataRoute } from "next";
import { dbGetProductSlugs, dbGetCategories } from "@/lib/db/repository";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/products",
    "/categories",
    "/login",
    "/register",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7,
  }));

  const [productsRes, catsRes] = await Promise.all([
    dbGetProductSlugs(),
    dbGetCategories(),
  ]);

  const productRoutes: MetadataRoute.Sitemap = (
    (productsRes.data ?? []) as { slug: string; updated_at: Date | null }[]
  ).map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = (
    (catsRes.data ?? []) as { slug: string }[]
  ).map((c) => ({
    url: `${base}/products?category=${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
