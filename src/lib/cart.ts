import { createClient } from "@/lib/insforge/server";
import { computeShipping } from "@/lib/utils";
import type { CartItemWithProduct } from "@/lib/types";

export interface CartSummary {
  items: CartItemWithProduct[];
  subtotal: number;
  shipping: number;
  total: number;
  count: number;
}

export async function getCart(): Promise<CartSummary> {
  const empty: CartSummary = {
    items: [],
    subtotal: 0,
    shipping: 0,
    total: 0,
    count: 0,
  };
  const insforge = await createClient();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();
  if (!user) return empty;

  const { data } = await insforge.database
    .from("cart_items")
    .select("*, product:products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = ((data ?? []) as CartItemWithProduct[]).filter(
    (it) => it.product
  );
  const subtotal = items.reduce(
    (s, it) => s + it.product.mrp * it.quantity,
    0
  );
  const shipping = computeShipping(subtotal);
  const count = items.reduce((s, it) => s + it.quantity, 0);

  return { items, subtotal, shipping, total: subtotal + shipping, count };
}
