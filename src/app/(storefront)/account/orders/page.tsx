import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dbGetOrders } from "@/lib/db/repository";
import { getUser } from "@/lib/auth";
import { formatPrice, formatDate, orderStatusVariant } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "My Orders", robots: { index: false } };

export default async function OrdersPage() {
  const user = await getUser();
  const { data } = await dbGetOrders({ userId: user!.id, pageSize: 100 });
  const orders = (data ?? []) as Order[];

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <Package className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="font-medium">No orders yet</p>
          <p className="mb-4 text-sm text-muted-foreground">
            When you place an order it will appear here.
          </p>
          <Button asChild>
            <Link href="/products">Start Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <Card key={o.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{o.order_number}</p>
                <Badge variant={orderStatusVariant(o.status)} className="capitalize">
                  {o.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(o.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold">{formatPrice(o.total)}</span>
              <Button asChild variant="outline" size="sm">
                <Link href={`/account/orders/${o.id}`}>View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
