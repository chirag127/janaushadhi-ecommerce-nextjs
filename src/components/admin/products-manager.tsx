"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { deleteProduct } from "@/app/actions/admin";
import { formatPrice } from "@/lib/utils";
import type { Category, Product } from "@/lib/types";

export function ProductsManager({
  products,
  categories,
  total,
}: {
  products: Product[];
  categories: Category[];
  total: number;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [query, setQuery] = React.useState("");

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setDialogOpen(true);
  }

  async function onDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const res = await deleteProduct(p.id);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Deleted");
      router.refresh();
    }
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query ? `/admin/products?q=${encodeURIComponent(query)}` : "/admin/products");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products ({total})</h1>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <form onSubmit={onSearch} className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="pl-9"
        />
      </form>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Code</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Stock</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-accent/30">
                  <td className="max-w-xs p-3">
                    <span className="line-clamp-1">{p.name}</span>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.drug_code}</td>
                  <td className="p-3">{formatPrice(p.mrp)}</td>
                  <td className="p-3">
                    <span className={p.stock <= 10 ? "text-amber-500" : ""}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-3">
                    {p.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(p)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onDelete(p)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <ProductFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        product={editing}
        categories={categories}
      />
    </div>
  );
}
