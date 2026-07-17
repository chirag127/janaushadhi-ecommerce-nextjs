"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateCartQuantity, removeFromCart } from "@/app/actions/cart";

export function CartItemControls({
  itemId,
  quantity,
  maxStock,
}: {
  itemId: string;
  quantity: number;
  maxStock: number;
}) {
  const router = useRouter();
  const [qty, setQty] = React.useState(quantity);
  const [pending, setPending] = React.useState(false);

  async function change(next: number) {
    if (next < 1 || next > maxStock) return;
    setQty(next);
    setPending(true);
    const res = await updateCartQuantity(itemId, next);
    setPending(false);
    if (res?.error) {
      toast.error(res.error);
      setQty(quantity);
    } else {
      router.refresh();
    }
  }

  async function remove() {
    setPending(true);
    const res = await removeFromCart(itemId);
    setPending(false);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Removed from cart");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-md border">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => change(qty - 1)}
          disabled={pending || qty <= 1}
          aria-label="Decrease"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-8 text-center text-sm">{qty}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => change(qty + 1)}
          disabled={pending || qty >= maxStock}
          aria-label="Increase"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive"
        onClick={remove}
        disabled={pending}
        aria-label="Remove"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
