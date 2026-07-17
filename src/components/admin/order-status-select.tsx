"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";
import { updateOrderStatus } from "@/app/actions/admin";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(status);
  const [pending, setPending] = React.useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as OrderStatus;
    setValue(next);
    setPending(true);
    const res = await updateOrderStatus(orderId, next);
    setPending(false);
    if (res?.error) {
      toast.error(res.error);
      setValue(status);
    } else {
      toast.success("Order status updated");
      router.refresh();
    }
  }

  return (
    <Select
      value={value}
      onChange={onChange}
      disabled={pending}
      className="w-40 capitalize"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="capitalize">
          {s}
        </option>
      ))}
    </Select>
  );
}
