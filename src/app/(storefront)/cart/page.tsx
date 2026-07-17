import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Package, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CartItemControls } from "@/components/storefront/cart-item-controls";
import { getCart } from "@/lib/cart";
import { getUser } from "@/lib/auth";
import { formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/utils";

export const metadata: Metadata = { title: "Your Cart" };

export default async function CartPage() {
  const user = await getUser();
  if (!user) redirect("/login?redirect=/cart");

  const { items, subtotal, shipping, total } = await getCart();

  if (items.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center py-24 text-center">
        <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mb-6 text-muted-foreground">
          Add some products to get started.
        </p>
        <Button asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Your Cart</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {shipping > 0 && remaining > 0 && (
            <Card className="bg-accent/10 p-3 text-sm">
              Add <strong>{formatPrice(remaining)}</strong> more to get{" "}
              <strong>free shipping</strong>.
            </Card>
          )}
          {items.map((it) => (
            <Card key={it.id} className="flex gap-4 p-4">
              <Link
                href={`/products/${it.product.slug}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted"
              >
                {it.product.image_url ? (
                  <Image
                    src={it.product.image_url}
                    alt={it.product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                    <Package className="h-8 w-8" />
                  </div>
                )}
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={`/products/${it.product.slug}`}
                    className="line-clamp-2 font-medium hover:text-primary"
                  >
                    {it.product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(it.product.mrp)}
                    {it.product.unit_size && ` · ${it.product.unit_size}`}
                  </p>
                </div>
                <CartItemControls
                  itemId={it.id}
                  quantity={it.quantity}
                  maxStock={Math.max(it.product.stock, it.quantity)}
                />
              </div>
              <div className="text-right font-semibold">
                {formatPrice(it.product.mrp * it.quantity)}
              </div>
            </Card>
          ))}
        </div>

        <div>
          <Card className="sticky top-20 space-y-4 p-6">
            <h2 className="text-lg font-semibold">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link href="/checkout">
                Checkout <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
