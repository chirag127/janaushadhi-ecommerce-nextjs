import type { MetadataRoute } from "next";
import { createClient } from "@/lib/insforge/server";
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

  const insforge = await createClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    insforge.database
      .from("products")
      .select("slug, updated_at")
      .eq("is_active", true)
      .limit(5000),
    insforge.database.from("categories").select("slug"),
  ]);

  const productRoutes: MetadataRoute.Sitemap = (
    (products ?? []) as { slug: string; updated_at: string | null }[]
  ).map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = (
    (categories ?? []) as { slug: string }[]
  ).map((c) => ({
    url: `${base}/products?category=${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
