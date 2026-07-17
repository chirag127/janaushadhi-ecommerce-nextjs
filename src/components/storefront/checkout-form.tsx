"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Tag, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateCoupon, placeOrder } from "@/app/actions/order";
import { formatPrice } from "@/lib/utils";
import type { Address } from "@/lib/types";

function PlaceOrderButton({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Place Order · {formatPrice(total)}
    </Button>
  );
}

export function CheckoutForm({
  addresses,
  subtotal,
  shipping,
}: {
  addresses: Address[];
  subtotal: number;
  shipping: number;
}) {
  const defaultAddr =
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? "";
  const [addressId, setAddressId] = React.useState(defaultAddr);
  const [payment, setPayment] = React.useState("cod");

  const [code, setCode] = React.useState("");
  const [applied, setApplied] = React.useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponPending, setCouponPending] = React.useState(false);

  const discount = applied?.discount ?? 0;
  const total = Math.max(0, subtotal - discount) + shipping;

  async function applyCoupon() {
    if (!code.trim()) return;
    setCouponPending(true);
    const res = await validateCoupon(code, subtotal);
    setCouponPending(false);
    if (res.error) {
      toast.error(res.error);
      setApplied(null);
    } else {
      setApplied({ code: res.code!, discount: res.discount! });
      toast.success(`Coupon applied — you save ${formatPrice(res.discount!)}`);
    }
  }

  async function action(formData: FormData) {
    if (!addressId) {
      toast.error("Please select a delivery address");
      return;
    }
    const res = await placeOrder(null, formData);
    if (res?.error) toast.error(res.error);
    // success path redirects server-side
  }

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <input type="hidden" name="address_id" value={addressId} />
      <input type="hidden" name="coupon_code" value={applied?.code ?? ""} />
      <input type="hidden" name="payment_method" value={payment} />

      <div className="space-y-6">
        {/* Address selection */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="h-5 w-5" /> Delivery Address
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/account/addresses">
                <Plus className="h-4 w-4" /> Add new
              </Link>
            </Button>
          </div>

          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No addresses yet.{" "}
              <Link href="/account/addresses" className="text-primary underline">
                Add a delivery address
              </Link>{" "}
              to continue.
            </p>
          ) : (
            <div className="space-y-3">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer gap-3 rounded-md border p-3 ${
                    addressId === a.id ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="address_radio"
                    className="mt-1"
                    checked={addressId === a.id}
                    onChange={() => setAddressId(a.id)}
                  />
                  <div className="text-sm">
                    <p className="font-medium">
                      {a.full_name} · {a.phone}
                    </p>
                    <p className="text-muted-foreground">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} –{" "}
                      {a.pincode}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </Card>

        {/* Payment method */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Payment Method</h2>
          <div className="space-y-3">
            {[
              { id: "cod", label: "Cash on Delivery", desc: "Pay when you receive your order." },
              { id: "upi", label: "UPI / Card (Demo)", desc: "Simulated payment for demo." },
            ].map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer gap-3 rounded-md border p-3 ${
                  payment === m.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <input
                  type="radio"
                  name="payment_radio"
                  className="mt-1"
                  checked={payment === m.id}
                  onChange={() => setPayment(m.id)}
                />
                <div className="text-sm">
                  <p className="font-medium">{m.label}</p>
                  <p className="text-muted-foreground">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* Summary */}
      <div>
        <Card className="sticky top-20 space-y-4 p-6">
          <h2 className="text-lg font-semibold">Order Summary</h2>

          <div className="space-y-2">
            <Label htmlFor="coupon" className="flex items-center gap-1">
              <Tag className="h-4 w-4" /> Coupon code
            </Label>
            <div className="flex gap-2">
              <Input
                id="coupon"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SAVE10"
              />
              <Button
                type="button"
                variant="outline"
                onClick={applyCoupon}
                disabled={couponPending}
              >
                {couponPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Discount ({applied?.code})</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <PlaceOrderButton total={total} />
        </Card>
      </div>
    </form>
  );
}
