"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/app/actions/cart";

export function ProductPurchase({
  productId,
  isAuthed,
  maxStock,
}: {
  productId: string;
  isAuthed: boolean;
  maxStock: number;
}) {
  const router = useRouter();
  const [qty, setQty] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const outOfStock = maxStock <= 0;

  async function handleAdd() {
    if (!isAuthed) {
      router.push(`/login?redirect=/products`);
      return;
    }
    setLoading(true);
    const res = await addToCart(productId, qty);
    setLoading(false);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Added to cart");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-md border">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1 || outOfStock}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-10 text-center text-sm font-medium">{qty}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setQty((q) => Math.min(maxStock, q + 1))}
          disabled={qty >= maxStock || outOfStock}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Button onClick={handleAdd} disabled={loading || outOfStock} size="lg">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        {outOfStock ? "Out of Stock" : "Add to Cart"}
      </Button>
    </div>
  );
}
