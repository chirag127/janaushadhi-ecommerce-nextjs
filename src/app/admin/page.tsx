import type { Metadata } from "next";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Users,
  IndianRupee,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/insforge/server";
import { formatPrice, formatDate, orderStatusVariant } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const insforge = await createClient();

  const [
    productCount,
    orderCount,
    userCount,
    lowStock,
    recentOrdersRes,
    allOrdersRes,
  ] = await Promise.all([
    insforge.database.from("products").select("id", { count: "exact", head: true }),
    insforge.database.from("orders").select("id", { count: "exact", head: true }),
    insforge.database.from("profiles").select("id", { count: "exact", head: true }),
    insforge.database
      .from("products")
      .select("id", { count: "exact", head: true })
      .lte("stock", 10),
    insforge.database
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    insforge.database.from("orders").select("total, status"),
  ]);

  const allOrders = (allOrdersRes.data ?? []) as Pick<
    Order,
    "total" | "status"
  >[];
  const revenue = allOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total), 0);

  const recentOrders = (recentOrdersRes.data ?? []) as Order[];

  const stats = [
    {
      label: "Revenue",
      value: formatPrice(revenue),
      icon: IndianRupee,
    },
    { label: "Orders", value: orderCount.count ?? 0, icon: ShoppingBag },
    { label: "Products", value: productCount.count ?? 0, icon: Package },
    { label: "Customers", value: userCount.count ?? 0, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(lowStock.count ?? 0) > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="text-sm">
              <strong>{lowStock.count}</strong> product(s) are low on stock.{" "}
              <Link href="/admin/inventory" className="text-primary underline">
                Manage inventory
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link
            href="/admin/orders"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">
              No orders yet.
            </p>
          ) : (
            <div className="divide-y">
              {recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between py-3 hover:bg-accent/50"
                >
                  <div>
                    <p className="font-medium">{o.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(o.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={orderStatusVariant(o.status)}
                      className="capitalize"
                    >
                      {o.status}
                    </Badge>
                    <span className="font-semibold">
                      {formatPrice(o.total)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
