import { getSessionUser } from "@/lib/db/auth-stub";
import { dbGetCart } from "@/lib/db/repository";
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
  const empty: CartSummary = { items: [], subtotal: 0, shipping: 0, total: 0, count: 0 };
  const user = await getSessionUser();
  if (!user) return empty;

  const { data } = await dbGetCart(user.id);
  const items = (data ?? []).filter((it) => it.product);
  const subtotal = items.reduce((s, it) => s + it.product.mrp * it.quantity, 0);
  const shipping = computeShipping(subtotal);
  const count = items.reduce((s, it) => s + it.quantity, 0);
  return { items, subtotal, shipping, total: subtotal + shipping, count };
}
