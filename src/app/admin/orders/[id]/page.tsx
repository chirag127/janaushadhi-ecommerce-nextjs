import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { createClient } from "@/lib/insforge/server";
import { formatPrice, formatDateTime } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types";

export const metadata: Metadata = { title: "Order Details" };

type Params = Promise<{ id: string }>;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const insforge = await createClient();
  const { data } = await insforge.database
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const o = data as Order & { items: OrderItem[] };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{o.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(o.created_at)}
          </p>
        </div>
        <OrderStatusSelect orderId={o.id} status={o.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {o.items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground">
                    <Package className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{it.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      #{it.drug_code} · {it.quantity} ×{" "}
                      {formatPrice(it.unit_price)}
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
                  <span>Discount {o.coupon_code && `(${o.coupon_code})`}</span>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{o.shipping_name}</p>
            <p className="text-muted-foreground">{o.shipping_phone}</p>
            <p className="text-muted-foreground">
              {o.shipping_line1}
              {o.shipping_line2 ? `, ${o.shipping_line2}` : ""}
            </p>
            <p className="text-muted-foreground">
              {o.shipping_city}, {o.shipping_state} – {o.shipping_pincode}
            </p>
            <p className="pt-2">
              <span className="text-muted-foreground">Payment: </span>
              <span className="uppercase">{o.payment_method}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
