import type { Metadata } from "next";
import { AddressManager } from "@/components/account/address-manager";
import { dbGetAddresses } from "@/lib/db/repository";
import { getUser } from "@/lib/auth";
import type { Address } from "@/lib/types";

export const metadata: Metadata = {
  title: "Addresses",
  robots: { index: false },
};

export default async function AddressesPage() {
  const user = await getUser();
  const { data } = await dbGetAddresses(user!.id);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Saved Addresses</h2>
      <AddressManager addresses={(data ?? []) as Address[]} />
    </div>
  );
}
