import type { Metadata } from "next";
import Link from "next/link";
import { Package, MapPin, Heart, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/insforge/server";
import { getUser } from "@/lib/auth";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function AccountDashboardPage() {
  const user = await getUser();
  const insforge = await createClient();

  const [{ data: profile }, ordersRes, addrCount, wishCount] =
    await Promise.all([
      insforge.database
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .single(),
      insforge.database
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(3),
      insforge.database
        .from("addresses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id),
      insforge.database
        .from("wishlist_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id),
    ]);

  const orders = (ordersRes.data ?? []) as Order[];
  const { count: totalOrders } = await insforge.database
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const stats = [
    { label: "Orders", value: totalOrders ?? 0, icon: Package, href: "/account/orders" },
    { label: "Addresses", value: addrCount.count ?? 0, icon: MapPin, href: "/account/addresses" },
    { label: "Wishlist", value: wishCount.count ?? 0, icon: Heart, href: "/account/wishlist" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Welcome back,</p>
          <p className="text-xl font-semibold">
            {profile?.full_name || user!.email}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-colors hover:border-primary">
              <CardContent className="flex items-center gap-3 pt-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link
            href="/account/orders"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              You haven&apos;t placed any orders yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link key={o.id} href={`/account/orders/${o.id}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <p className="font-medium">{o.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(o.created_at)} · {o.status}
                      </p>
                    </div>
                    <span className="font-semibold">{formatPrice(o.total)}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
