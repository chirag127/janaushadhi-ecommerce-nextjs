"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleWishlist } from "@/app/actions/wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  isAuthed,
  initialInWishlist = false,
  size = "icon",
}: {
  productId: string;
  isAuthed: boolean;
  initialInWishlist?: boolean;
  size?: "icon" | "default";
}) {
  const router = useRouter();
  const [active, setActive] = React.useState(initialInWishlist);
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    if (!isAuthed) {
      router.push("/login?redirect=/products");
      return;
    }
    setLoading(true);
    const res = await toggleWishlist(productId);
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    setActive(!!res.inWishlist);
    toast.success(res.success ?? "Updated");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={handleClick}
      disabled={loading}
      aria-label="Toggle wishlist"
    >
      <Heart
        className={cn("h-4 w-4", active && "fill-destructive text-destructive")}
      />
      {size === "default" && (
        <span>{active ? "In Wishlist" : "Add to Wishlist"}</span>
      )}
    </Button>
  );
}
