import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/insforge/server";
import { getUser } from "@/lib/auth";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false },
};

type Params = Promise<{ id: string }>;

export default async function OrderConfirmationPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) notFound();

  const insforge = await createClient();
  const { data: order } = await insforge.database
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) notFound();
  const o = order as Order & { items: OrderItem[] };

  return (
    <div className="container max-w-2xl py-12">
      <div className="mb-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-primary" />
        <h1 className="text-3xl font-bold">Thank you for your order!</h1>
        <p className="text-muted-foreground">
          Your order <strong>{o.order_number}</strong> has been placed.
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Order number</p>
            <p className="font-semibold">{o.order_number}</p>
          </div>
          <Badge variant="warning" className="capitalize">
            {o.status}
          </Badge>
        </div>

        <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Placed on</p>
            <p>{formatDate(o.created_at)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Payment</p>
            <p className="uppercase">{o.payment_method}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Shipping to</p>
            <p>
              {o.shipping_name}, {o.shipping_line1}
              {o.shipping_line2 ? `, ${o.shipping_line2}` : ""},{" "}
              {o.shipping_city}, {o.shipping_state} – {o.shipping_pincode}
            </p>
          </div>
        </div>

        <div className="divide-y border-t">
          {o.items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground">
                <Package className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="line-clamp-1 text-sm font-medium">
                  {it.product_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {it.quantity} × {formatPrice(it.unit_price)}
                </p>
              </div>
              <span className="font-medium">
                {formatPrice(it.unit_price * it.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(o.subtotal)}</span>
          </div>
          {o.discount > 0 && (
            <div className="flex justify-between text-primary">
              <span>Discount</span>
              <span>−{formatPrice(o.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {o.shipping_fee === 0 ? "Free" : formatPrice(o.shipping_fee)}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(o.total)}</span>
          </div>
        </div>
      </Card>

      <div className="mt-6 flex justify-center gap-3">
        <Button asChild variant="outline">
          <Link href="/account/orders">View Orders</Link>
        </Button>
        <Button asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
