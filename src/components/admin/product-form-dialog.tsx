"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { upsertProduct } from "@/app/actions/admin";
import type { Category, Product } from "@/lib/types";

export function ProductFormDialog({
  open,
  onClose,
  product,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
}) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  if (!open) return null;

  async function action(formData: FormData) {
    setSaving(true);
    const res = await upsertProduct(null, formData);
    setSaving(false);
    if (res?.error) toast.error(res.error);
    else {
      toast.success(res?.success ?? "Saved");
      onClose();
      router.refresh();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-lg border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">
          {product ? "Edit Product" : "Add Product"}
        </h2>
        <form action={action} className="space-y-4">
          {product && <input type="hidden" name="id" value={product.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="drug_code">Drug code</Label>
              <Input
                id="drug_code"
                name="drug_code"
                required
                defaultValue={product?.drug_code}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_size">Unit size</Label>
              <Input
                id="unit_size"
                name="unit_size"
                placeholder="e.g. Tablet 10's"
                defaultValue={product?.unit_size ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Product name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={product?.name}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP (₹)</Label>
              <Input
                id="mrp"
                name="mrp"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={product?.mrp}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                required
                defaultValue={product?.stock ?? 100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select
                id="category_id"
                name="category_id"
                defaultValue={product?.category_id ?? ""}
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              name="image_url"
              type="url"
              placeholder="https://…"
              defaultValue={product?.image_url ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={product?.description ?? ""}
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_featured"
                defaultChecked={product?.is_featured}
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={product?.is_active ?? true}
              />
              Active
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
