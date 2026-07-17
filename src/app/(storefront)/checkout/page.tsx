import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { createClient } from "@/lib/insforge/server";
import { getCart } from "@/lib/cart";
import { getUser } from "@/lib/auth";
import type { Address } from "@/lib/types";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getUser();
  if (!user) redirect("/login?redirect=/checkout");

  const { items, subtotal, shipping } = await getCart();
  if (items.length === 0) redirect("/cart");

  const insforge = await createClient();
  const { data: addresses } = await insforge.database
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <Button asChild variant="ghost" size="sm">
          <Link href="/cart">Back to cart</Link>
        </Button>
      </div>

      <CheckoutForm
        addresses={(addresses ?? []) as Address[]}
        subtotal={subtotal}
        shipping={shipping}
      />
    </div>
  );
}
