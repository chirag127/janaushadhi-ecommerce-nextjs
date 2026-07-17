import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  isAuthed,
  inWishlist = false,
}: {
  product: Product;
  isAuthed: boolean;
  inWishlist?: boolean;
}) {
  const outOfStock = product.stock <= 0;

  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <Package className="h-16 w-16" />
          </div>
        )}
        {product.is_featured && (
          <Badge variant="accent" className="absolute left-2 top-2">
            Featured
          </Badge>
        )}
        {outOfStock && (
          <Badge variant="destructive" className="absolute right-2 top-2">
            Out of stock
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/products/${product.slug}`} className="flex-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {product.unit_size && <span>{product.unit_size}</span>}
          <span className="rounded bg-muted px-1.5 py-0.5">
            #{product.drug_code}
          </span>
        </div>
        <p className="text-lg font-bold text-primary">
          {formatPrice(product.mrp)}
        </p>

        <div className="mt-1 flex items-center gap-2">
          <AddToCartButton
            productId={product.id}
            isAuthed={isAuthed}
            size="sm"
            className="flex-1"
            label="Add"
          />
          <WishlistButton
            productId={product.id}
            isAuthed={isAuthed}
            initialInWishlist={inWishlist}
            size="icon"
          />
        </div>
      </div>
    </Card>
  );
}
