import type { Metadata } from "next";
import { CouponsManager } from "@/components/admin/coupons-manager";
import { dbGetCouponsAll } from "@/lib/db/repository";
import type { Coupon } from "@/lib/types";

export const metadata: Metadata = { title: "Manage Coupons" };

export default async function AdminCouponsPage() {
  const { data } = await dbGetCouponsAll();
  return <CouponsManager coupons={(data ?? []) as Coupon[]} />;
}
