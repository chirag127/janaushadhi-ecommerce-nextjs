import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/storefront/pagination";
import { createClient } from "@/lib/insforge/server";
import { formatPrice, formatDate, orderStatusVariant } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Manage Orders" };

const PAGE_SIZE = 20;
type SearchParams = Promise<{ status?: string; page?: string }>;

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const insforge = await createClient();
  let builder = insforge.database
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  if (sp.status) builder = builder.eq("status", sp.status);

  const { data, count } = await builder.range(from, to);
  const orders = (data ?? []) as Order[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders ({count ?? 0})</h1>

      <div className="flex flex-wrap gap-2">
        <Button
          asChild
          variant={!sp.status ? "default" : "outline"}
          size="sm"
        >
          <Link href="/admin/orders">All</Link>
        </Button>
        {STATUSES.map((s) => (
          <Button
            key={s}
            asChild
            variant={sp.status === s ? "default" : "outline"}
            size="sm"
            className="capitalize"
          >
            <Link href={`/admin/orders?status=${s}`}>{s}</Link>
          </Button>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Order</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-accent/30">
                  <td className="p-3 font-medium">{o.order_number}</td>
                  <td className="p-3">{o.shipping_name}</td>
                  <td className="p-3 text-muted-foreground">
                    {formatDate(o.created_at)}
                  </td>
                  <td className="p-3">{formatPrice(o.total)}</td>
                  <td className="p-3">
                    <Badge
                      variant={orderStatusVariant(o.status)}
                      className="capitalize"
                    >
                      {o.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/orders/${o.id}`}>Manage</Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        baseParams={{ status: sp.status }}
      />
    </div>
  );
}
