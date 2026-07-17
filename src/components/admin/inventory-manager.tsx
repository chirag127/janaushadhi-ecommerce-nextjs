"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateStock } from "@/app/actions/admin";
import type { Product } from "@/lib/types";

function StockRow({ product }: { product: Product }) {
  const router = useRouter();
  const [stock, setStock] = React.useState(product.stock);
  const [pending, setPending] = React.useState(false);
  const dirty = stock !== product.stock;

  async function save() {
    setPending(true);
    const res = await updateStock(product.id, stock);
    setPending(false);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Stock updated");
      router.refresh();
    }
  }

  return (
    <tr className="hover:bg-accent/30">
      <td className="max-w-xs p-3">
        <span className="line-clamp-1">{product.name}</span>
      </td>
      <td className="p-3 text-muted-foreground">{product.drug_code}</td>
      <td className="p-3">
        <span
          className={
            product.stock <= 0
              ? "text-destructive"
              : product.stock <= 10
              ? "text-amber-500"
              : ""
          }
        >
          {product.stock <= 0
            ? "Out"
            : product.stock <= 10
            ? "Low"
            : "OK"}
        </span>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="h-8 w-24"
          />
          <Button
            size="icon"
            className="h-8 w-8"
            onClick={save}
            disabled={!dirty || pending}
            aria-label="Save stock"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function InventoryManager({ products }: { products: Product[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th className="p-3 font-medium">Product</th>
            <th className="p-3 font-medium">Code</th>
            <th className="p-3 font-medium">Level</th>
            <th className="p-3 font-medium">Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {products.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-8 text-center text-muted-foreground">
                No products found.
              </td>
            </tr>
          ) : (
            products.map((p) => <StockRow key={p.id} product={p} />)
          )}
        </tbody>
      </table>
    </div>
  );
}
