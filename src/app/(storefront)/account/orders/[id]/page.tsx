import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Package, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/insforge/server";
import { getUser } from "@/lib/auth";
import {
  formatPrice,
  formatDateTime,
  orderStatusVariant,
} from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Order Details",
  robots: { index: false },
};

type Params = Promise<{ id: string }>;

export default async function OrderDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const user = await getUser();
  const insforge = await createClient();
  const { data } = await insforge.database
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!data) notFound();
  const o = data as Order & { items: OrderItem[] };
  const sa = o.shipping_address;

  return (
    <div className="space-y-6">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">{o.order_number}</h2>
              <p className="text-sm text-muted-foreground">
                Placed {formatDateTime(o.created_at)}
              </p>
            </div>
            <Badge variant={orderStatusVariant(o.status)} className="capitalize">
              {o.status}
            </Badge>
          </div>

          <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Payment method</p>
              <p className="uppercase">
                {sa?._payment_method === "razorpay" ? "ONLINE" : "COD"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Shipping address</p>
              <p>
                {sa?.full_name}, {sa?.line1}
                {sa?.line2 ? `, ${sa.line2}` : ""},{" "}
                {sa?.city}, {sa?.state} – {sa?.pincode}
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
                  <p className="text-sm font-medium">{it.product_name}</p>
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
                {o.shipping === 0 ? "Free" : formatPrice(o.shipping)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(o.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
