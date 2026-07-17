"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { addToCart } from "@/app/actions/cart";

export function AddToCartButton({
  productId,
  isAuthed,
  quantity = 1,
  label = "Add to Cart",
  className,
  variant = "default",
  size = "default",
}: {
  productId: string;
  isAuthed: boolean;
  quantity?: number;
  label?: string;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function handleClick() {
    if (!isAuthed) {
      router.push("/login?redirect=/products");
      return;
    }
    setLoading(true);
    const res = await addToCart(productId, quantity);
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Added to cart");
      setDone(true);
      setTimeout(() => setDone(false), 1500);
      router.refresh();
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : done ? (
        <Check className="h-4 w-4" />
      ) : (
        <ShoppingCart className="h-4 w-4" />
      )}
      {size !== "icon" && <span>{label}</span>}
    </Button>
  );
}
