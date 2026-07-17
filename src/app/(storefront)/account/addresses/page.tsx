import type { Metadata } from "next";
import { AddressManager } from "@/components/account/address-manager";
import { createClient } from "@/lib/insforge/server";
import { getUser } from "@/lib/auth";
import type { Address } from "@/lib/types";

export const metadata: Metadata = {
  title: "Addresses",
  robots: { index: false },
};

export default async function AddressesPage() {
  const user = await getUser();
  const insforge = await createClient();
  const { data } = await insforge.database
    .from("addresses")
    .select("*")
    .eq("user_id", user!.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Saved Addresses</h2>
      <AddressManager addresses={(data ?? []) as Address[]} />
    </div>
  );
}
