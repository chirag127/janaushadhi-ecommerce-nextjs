import type { Metadata } from "next";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { getCategoriesWithCount } from "@/lib/queries";

export const metadata: Metadata = { title: "Manage Categories" };

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesWithCount();
  return <CategoriesManager categories={categories} />;
}
