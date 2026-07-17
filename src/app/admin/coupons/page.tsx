import type { Metadata } from "next";
import { CouponsManager } from "@/components/admin/coupons-manager";
import { createClient } from "@/lib/insforge/server";
import type { Coupon } from "@/lib/types";

export const metadata: Metadata = { title: "Manage Coupons" };

export default async function AdminCouponsPage() {
  const insforge = await createClient();
  const { data } = await insforge.database
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return <CouponsManager coupons={(data ?? []) as Coupon[]} />;
}
