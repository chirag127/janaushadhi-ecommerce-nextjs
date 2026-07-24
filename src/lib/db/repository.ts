/**
 * Neon/Drizzle repository — drop-in adapter for the former InsForge SDK.
 *
 * Every exported function returns { data, error?, count? } to match the
 * InsForge builder shape consumed by the rest of the app. Auth calls are
 * forwarded to the auth-stub (src/lib/insforge/server.ts stub).
 *
 * This is the single seam between app code and Neon Postgres.
 */
import { db } from "./client";
import {
  profiles,
  categories,
  products,
  addresses,
  cart_items,
  wishlist_items,
  coupons,
  orders,
  order_items,
  reviews,
} from "./schema";
import { eq, and, ilike, gte, lte, gt, ne, asc, desc, count as sqlCount, sql } from "drizzle-orm";
import type {
  Category,
  Product,
  Address,
  CartItemWithProduct,
  Coupon,
  Order,
  OrderItem,
  Profile,
} from "@/lib/types";

type Row = Record<string, unknown>;

// ---- helpers ---------------------------------------------------------------
function ok<T>(data: T, count?: number) {
  return { data, error: null, count: count ?? null };
}
function err(msg: string) {
  return { data: null, error: { message: msg }, count: null };
}

// Numeric columns come back as strings from Neon HTTP driver; normalise them.
function numStr(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}
function coerceProduct(r: Row): Product {
  return {
    ...(r as unknown as Product),
    mrp: numStr(r.mrp),
    price: numStr(r.price),
  };
}
function coerceCoupon(r: Row): Coupon {
  return {
    ...(r as unknown as Coupon),
    discount_value: numStr(r.discount_value),
    min_order_amount: numStr(r.min_order_amount),
    max_discount_amount: r.max_discount_amount != null ? numStr(r.max_discount_amount) : null,
  };
}
function coerceOrder(r: Row): Order {
  return {
    ...(r as unknown as Order),
    subtotal: numStr(r.subtotal),
    discount: numStr(r.discount),
    shipping: numStr(r.shipping),
    total: numStr(r.total),
  };
}
function coerceOrderItem(r: Row): OrderItem {
  return {
    ...(r as unknown as OrderItem),
    unit_price: numStr(r.unit_price),
    line_total: numStr(r.line_total),
  };
}

// ---- Categories ------------------------------------------------------------
export async function dbGetCategories() {
  try {
    const rows = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sort_order), asc(categories.name));
    return ok(rows as unknown as Category[]);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetCategoryBySlug(slug: string) {
  try {
    const rows = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
    return ok((rows[0] ?? null) as unknown as Category | null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetCategoriesWithCount() {
  try {
    const cats = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sort_order), asc(categories.name));
    const results = await Promise.all(
      cats.map(async (c) => {
        const [row] = await db
          .select({ count: sqlCount() })
          .from(products)
          .where(and(eq(products.category_id, c.id), eq(products.is_active, true)));
        return { ...(c as unknown as Category), product_count: row?.count ?? 0 };
      })
    );
    return ok(results);
  } catch (e) {
    return err(String(e));
  }
}

// ---- Products --------------------------------------------------------------
export async function dbGetProducts(query: {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "name";
  featured?: boolean;
  excludeOnRequest?: boolean;
  page?: number;
  pageSize?: number;
}) {
  try {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = query.pageSize ?? 12;
    const offset = (page - 1) * pageSize;

    const conditions = [eq(products.is_active, true)];
    if (query.q) {
      const term = `%${query.q.replace(/[%,]/g, " ").trim()}%`;
      conditions.push(sql`(${products.name} ilike ${term} or ${products.description} ilike ${term})`);
    }
    if (query.featured) conditions.push(eq(products.is_featured, true));
    if (query.minPrice != null) conditions.push(gte(products.mrp, String(query.minPrice)));
    if (query.maxPrice != null) conditions.push(lte(products.mrp, String(query.maxPrice)));
    if (query.excludeOnRequest) conditions.push(gt(products.price, "0"));
    if (query.categoryId) conditions.push(eq(products.category_id, query.categoryId));

    const where = and(...conditions);

    const [{ total }] = await db
      .select({ total: sqlCount() })
      .from(products)
      .where(where);

    const orderBy =
      query.sort === "price_asc"
        ? asc(products.mrp)
        : query.sort === "price_desc"
        ? desc(products.mrp)
        : query.sort === "name"
        ? asc(products.name)
        : desc(products.created_at);

    const rows = await db
      .select({
        id: products.id,
        drug_code: products.drug_code,
        name: products.name,
        slug: products.slug,
        unit_size: products.unit_size,
        mrp: products.mrp,
        price: products.price,
        category_id: products.category_id,
        description: products.description,
        image_url: products.image_url,
        stock: products.stock,
        is_featured: products.is_featured,
        is_active: products.is_active,
        created_at: products.created_at,
        updated_at: products.updated_at,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.category_id, categories.id))
      .where(where)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    return ok(rows.map((r) => coerceProduct(r as Row)) as Product[], total);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetFeaturedProducts(limit = 8) {
  try {
    let rows = await db
      .select()
      .from(products)
      .where(and(eq(products.is_active, true), eq(products.is_featured, true), gt(products.mrp, "0")))
      .limit(limit);
    if (rows.length === 0) {
      rows = await db
        .select()
        .from(products)
        .where(and(eq(products.is_active, true), gt(products.mrp, "0")))
        .orderBy(asc(products.created_at))
        .limit(limit);
    }
    return ok(rows.map((r) => coerceProduct(r as Row)) as Product[]);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetProductBySlug(slug: string) {
  try {
    const rows = await db
      .select({
        id: products.id,
        drug_code: products.drug_code,
        name: products.name,
        slug: products.slug,
        unit_size: products.unit_size,
        mrp: products.mrp,
        price: products.price,
        category_id: products.category_id,
        description: products.description,
        image_url: products.image_url,
        stock: products.stock,
        is_featured: products.is_featured,
        is_active: products.is_active,
        created_at: products.created_at,
        updated_at: products.updated_at,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.category_id, categories.id))
      .where(eq(products.slug, slug))
      .limit(1);
    const row = rows[0] ?? null;
    return ok(row ? coerceProduct(row as Row) : null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetRelatedProducts(categoryId: string | null, excludeId: string, limit = 4) {
  if (!categoryId) return ok([] as Product[]);
  try {
    const rows = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.category_id, categoryId),
          eq(products.is_active, true),
          ne(products.id, excludeId)
        )
      )
      .limit(limit);
    return ok(rows.map((r) => coerceProduct(r as Row)) as Product[]);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbSearchProducts(q: string, limit = 8) {
  try {
    const term = `%${q}%`;
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        mrp: products.mrp,
        unit_size: products.unit_size,
      })
      .from(products)
      .where(and(eq(products.is_active, true), ilike(products.name, term)))
      .orderBy(asc(products.name))
      .limit(limit);
    return ok(rows.map((r) => ({ ...r, mrp: numStr(r.mrp) })));
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetProductsForAdmin(query: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const where = query.q ? ilike(products.name, `%${query.q}%`) : undefined;

    const [{ total }] = await db
      .select({ total: sqlCount() })
      .from(products)
      .where(where);

    const rows = await db
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.created_at))
      .limit(pageSize)
      .offset(offset);

    return ok(rows.map((r) => coerceProduct(r as Row)) as Product[], total);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetInventory(query: {
  filter?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = query.pageSize ?? 25;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.filter === "low") {
      conditions.push(lte(products.stock, 10), gt(products.stock, 0));
    } else if (query.filter === "out") {
      conditions.push(lte(products.stock, 0));
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const [{ total }] = await db.select({ total: sqlCount() }).from(products).where(where);
    const rows = await db
      .select()
      .from(products)
      .where(where)
      .orderBy(asc(products.stock))
      .limit(pageSize)
      .offset(offset);

    return ok(rows.map((r) => coerceProduct(r as Row)) as Product[], total);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbUpsertProduct(payload: {
  id?: string | null;
  drug_code: string;
  name: string;
  slug: string;
  unit_size: string | null;
  mrp: number;
  price: number;
  category_id: string | null;
  description: string | null;
  image_url: string | null;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
}) {
  try {
    const { id, mrp, price, ...rest } = payload;
    const row = { ...rest, mrp: String(mrp), price: String(price) };
    if (id) {
      await db.update(products).set(row).where(eq(products.id, id));
    } else {
      await db.insert(products).values(row);
    }
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbDeleteProduct(id: string) {
  try {
    await db.delete(products).where(eq(products.id, id));
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbUpdateStock(id: string, stock: number) {
  try {
    await db.update(products).set({ stock }).where(eq(products.id, id));
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetProductSlugs() {
  try {
    const rows = await db
      .select({ slug: products.slug, updated_at: products.updated_at })
      .from(products)
      .where(eq(products.is_active, true))
      .limit(5000);
    return ok(rows);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbCountProducts(maxStock?: number) {
  try {
    const where = maxStock != null ? lte(products.stock, maxStock) : undefined;
    const [{ total }] = await db.select({ total: sqlCount() }).from(products).where(where);
    return ok(null, total);
  } catch (e) {
    return err(String(e));
  }
}

// ---- Profiles --------------------------------------------------------------
export async function dbGetProfile(userId: string) {
  try {
    const rows = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    return ok((rows[0] ?? null) as unknown as Profile | null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetProfileField<K extends keyof Profile>(
  userId: string,
  fields: K[]
) {
  try {
    const rows = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    if (!rows[0]) return ok(null);
    const result = {} as Pick<Profile, K>;
    for (const f of fields) (result as Record<string, unknown>)[f] = rows[0][f];
    return ok(result);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbUpdateProfile(
  userId: string,
  data: { full_name?: string | null; phone?: string | null }
) {
  try {
    await db.update(profiles).set(data).where(eq(profiles.id, userId));
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbCountProfiles() {
  try {
    const [{ total }] = await db.select({ total: sqlCount() }).from(profiles);
    return ok(null, total);
  } catch (e) {
    return err(String(e));
  }
}

// ---- Addresses -------------------------------------------------------------
export async function dbGetAddresses(userId: string) {
  try {
    const rows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.user_id, userId))
      .orderBy(desc(addresses.is_default), desc(addresses.created_at));
    return ok(rows as unknown as Address[]);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetAddress(id: string, userId: string) {
  try {
    const rows = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.user_id, userId)))
      .limit(1);
    return ok((rows[0] ?? null) as unknown as Address | null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbClearDefaultAddresses(userId: string) {
  try {
    await db.update(addresses).set({ is_default: false }).where(eq(addresses.user_id, userId));
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbUpsertAddress(payload: {
  id?: string | null;
  user_id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}) {
  try {
    const { id, ...rest } = payload;
    if (id) {
      await db
        .update(addresses)
        .set(rest)
        .where(and(eq(addresses.id, id), eq(addresses.user_id, payload.user_id)));
    } else {
      await db.insert(addresses).values(rest);
    }
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbDeleteAddress(id: string, userId: string) {
  try {
    await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.user_id, userId)));
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbCountAddresses(userId: string) {
  try {
    const [{ total }] = await db
      .select({ total: sqlCount() })
      .from(addresses)
      .where(eq(addresses.user_id, userId));
    return ok(null, total);
  } catch (e) {
    return err(String(e));
  }
}

// ---- Cart ------------------------------------------------------------------
export async function dbGetCart(userId: string) {
  try {
    const rows = await db
      .select({
        id: cart_items.id,
        user_id: cart_items.user_id,
        product_id: cart_items.product_id,
        quantity: cart_items.quantity,
        created_at: cart_items.created_at,
        product: {
          id: products.id,
          drug_code: products.drug_code,
          name: products.name,
          slug: products.slug,
          unit_size: products.unit_size,
          mrp: products.mrp,
          price: products.price,
          category_id: products.category_id,
          description: products.description,
          image_url: products.image_url,
          stock: products.stock,
          is_featured: products.is_featured,
          is_active: products.is_active,
          created_at: products.created_at,
          updated_at: products.updated_at,
        },
      })
      .from(cart_items)
      .innerJoin(products, eq(cart_items.product_id, products.id))
      .where(eq(cart_items.user_id, userId))
      .orderBy(desc(cart_items.created_at));

    return ok(
      rows.map((r) => ({
        ...r,
        product: coerceProduct(r.product as Row),
      })) as unknown as CartItemWithProduct[]
    );
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetCartItem(userId: string, productId: string) {
  try {
    const rows = await db
      .select()
      .from(cart_items)
      .where(and(eq(cart_items.user_id, userId), eq(cart_items.product_id, productId)))
      .limit(1);
    return ok((rows[0] ?? null) as { id: string; quantity: number } | null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbAddToCart(userId: string, productId: string, quantity: number) {
  try {
    await db.insert(cart_items).values({ user_id: userId, product_id: productId, quantity });
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbUpdateCartQuantity(itemId: string, userId: string, quantity: number) {
  try {
    await db
      .update(cart_items)
      .set({ quantity })
      .where(and(eq(cart_items.id, itemId), eq(cart_items.user_id, userId)));
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbRemoveFromCart(itemId: string, userId: string) {
  try {
    await db
      .delete(cart_items)
      .where(and(eq(cart_items.id, itemId), eq(cart_items.user_id, userId)));
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbClearCart(userId: string) {
  try {
    await db.delete(cart_items).where(eq(cart_items.user_id, userId));
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbCountCartItems(userId: string) {
  try {
    const [{ total }] = await db
      .select({ total: sqlCount() })
      .from(cart_items)
      .where(eq(cart_items.user_id, userId));
    return ok(null, total);
  } catch (e) {
    return err(String(e));
  }
}

// ---- Wishlist --------------------------------------------------------------
export async function dbGetWishlistProductIds(userId: string) {
  try {
    const rows = await db
      .select({ product_id: wishlist_items.product_id })
      .from(wishlist_items)
      .where(eq(wishlist_items.user_id, userId));
    return ok(rows as { product_id: string }[]);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetWishlistWithProducts(userId: string) {
  try {
    const rows = await db
      .select({
        id: wishlist_items.id,
        user_id: wishlist_items.user_id,
        product_id: wishlist_items.product_id,
        created_at: wishlist_items.created_at,
        product: {
          id: products.id,
          drug_code: products.drug_code,
          name: products.name,
          slug: products.slug,
          unit_size: products.unit_size,
          mrp: products.mrp,
          price: products.price,
          category_id: products.category_id,
          description: products.description,
          image_url: products.image_url,
          stock: products.stock,
          is_featured: products.is_featured,
          is_active: products.is_active,
          created_at: products.created_at,
          updated_at: products.updated_at,
        },
      })
      .from(wishlist_items)
      .innerJoin(products, eq(wishlist_items.product_id, products.id))
      .where(eq(wishlist_items.user_id, userId))
      .orderBy(desc(wishlist_items.created_at));
    return ok(rows.map((r) => ({ ...r, product: coerceProduct(r.product as Row) })));
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetWishlistItem(userId: string, productId: string) {
  try {
    const rows = await db
      .select({ id: wishlist_items.id })
      .from(wishlist_items)
      .where(and(eq(wishlist_items.user_id, userId), eq(wishlist_items.product_id, productId)))
      .limit(1);
    return ok((rows[0] ?? null) as { id: string } | null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbAddToWishlist(userId: string, productId: string) {
  try {
    await db.insert(wishlist_items).values({ user_id: userId, product_id: productId });
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbRemoveFromWishlist(itemId: string, userId: string) {
  try {
    await db
      .delete(wishlist_items)
      .where(and(eq(wishlist_items.id, itemId), eq(wishlist_items.user_id, userId)));
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbCountWishlistItems(userId: string) {
  try {
    const [{ total }] = await db
      .select({ total: sqlCount() })
      .from(wishlist_items)
      .where(eq(wishlist_items.user_id, userId));
    return ok(null, total);
  } catch (e) {
    return err(String(e));
  }
}

// ---- Coupons ---------------------------------------------------------------
export async function dbGetCouponByCode(code: string) {
  try {
    const rows = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, code), eq(coupons.is_active, true)))
      .limit(1);
    const row = rows[0] ?? null;
    return ok(row ? coerceCoupon(row as Row) : null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetCouponIdByCode(code: string) {
  try {
    const rows = await db
      .select({ id: coupons.id, used_count: coupons.used_count })
      .from(coupons)
      .where(eq(coupons.code, code))
      .limit(1);
    return ok((rows[0] ?? null) as { id: string; used_count: number } | null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbIncrementCouponUsage(id: string, usedCount: number) {
  try {
    await db.update(coupons).set({ used_count: usedCount + 1 }).where(eq(coupons.id, id));
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetCouponsAll() {
  try {
    const rows = await db.select().from(coupons).orderBy(desc(coupons.created_at));
    return ok(rows.map((r) => coerceCoupon(r as Row)) as Coupon[]);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbUpsertCoupon(payload: {
  id?: string | null;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  expires_at: string | null;
  is_active: boolean;
}) {
  try {
    const { id, ...rest } = payload;
    const row = {
      ...rest,
      discount_value: String(rest.discount_value),
      min_order_amount: String(rest.min_order_amount),
      max_discount_amount: rest.max_discount_amount != null ? String(rest.max_discount_amount) : null,
      expires_at: rest.expires_at ? new Date(rest.expires_at) : null,
    };
    if (id) {
      await db.update(coupons).set(row).where(eq(coupons.id, id));
    } else {
      await db.insert(coupons).values(row);
    }
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbDeleteCoupon(id: string) {
  try {
    await db.delete(coupons).where(eq(coupons.id, id));
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

// ---- Orders ----------------------------------------------------------------
export async function dbGetOrders(query: {
  userId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  includeItems?: boolean;
}) {
  try {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.userId) conditions.push(eq(orders.user_id, query.userId));
    if (query.status) conditions.push(sql`${orders.status}::text = ${query.status}`);
    const where = conditions.length ? and(...conditions) : undefined;

    const [{ total }] = await db.select({ total: sqlCount() }).from(orders).where(where);
    const rows = await db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.created_at))
      .limit(pageSize)
      .offset(offset);

    return ok(rows.map((r) => coerceOrder(r as Row)) as Order[], total);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetOrderWithItems(id: string, userId?: string) {
  try {
    const conditions = [eq(orders.id, id)];
    if (userId) conditions.push(eq(orders.user_id, userId));
    const orderRows = await db.select().from(orders).where(and(...conditions)).limit(1);
    if (!orderRows[0]) return ok(null);

    const itemRows = await db.select().from(order_items).where(eq(order_items.order_id, id));
    return ok({
      ...coerceOrder(orderRows[0] as Row),
      items: itemRows.map((r) => coerceOrderItem(r as Row)),
    } as Order & { items: OrderItem[] });
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetRecentOrders(userId: string, limit: number) {
  try {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.user_id, userId))
      .orderBy(desc(orders.created_at))
      .limit(limit);
    return ok(rows.map((r) => coerceOrder(r as Row)) as Order[]);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbCountOrders(userId?: string) {
  try {
    const where = userId ? eq(orders.user_id, userId) : undefined;
    const [{ total }] = await db.select({ total: sqlCount() }).from(orders).where(where);
    return ok(null, total);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbGetAllOrderTotals() {
  try {
    const rows = await db
      .select({ total: orders.total, status: orders.status })
      .from(orders);
    return ok(rows.map((r) => ({ total: numStr(r.total), status: r.status as string })));
  } catch (e) {
    return err(String(e));
  }
}

export async function dbCreateOrder(payload: {
  order_number: string;
  user_id: string;
  status: string;
  payment_status: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currency: string;
  coupon_id: string | null;
  shipping_address: Record<string, unknown>;
  is_test_payment: boolean;
}) {
  try {
    const rows = await db
      .insert(orders)
      .values({
        ...payload,
        status: payload.status as "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded",
        payment_status: payload.payment_status as "created" | "pending" | "captured" | "failed" | "refunded",
        subtotal: String(payload.subtotal),
        discount: String(payload.discount),
        shipping: String(payload.shipping),
        total: String(payload.total),
      })
      .returning({ id: orders.id, order_number: orders.order_number });
    return ok(rows[0] as { id: string; order_number: string });
  } catch (e) {
    return err(String(e));
  }
}

export async function dbCreateOrderItems(
  items: {
    order_id: string;
    product_id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }[]
) {
  try {
    await db.insert(order_items).values(
      items.map((it) => ({
        ...it,
        unit_price: String(it.unit_price),
        line_total: String(it.line_total),
      }))
    );
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbUpdateOrderStatus(id: string, status: string) {
  try {
    await db
      .update(orders)
      .set({ status: status as "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded" })
      .where(eq(orders.id, id));
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

// ---- Reviews ---------------------------------------------------------------
export async function dbGetProductReviews(productId: string) {
  try {
    const rows = await db
      .select({
        id: reviews.id,
        product_id: reviews.product_id,
        user_id: reviews.user_id,
        rating: reviews.rating,
        title: reviews.title,
        comment: reviews.comment,
        created_at: reviews.created_at,
        profile: {
          full_name: profiles.full_name,
        },
      })
      .from(reviews)
      .leftJoin(profiles, eq(reviews.user_id, profiles.id))
      .where(eq(reviews.product_id, productId))
      .orderBy(desc(reviews.created_at));
    return ok(rows);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbUpsertReview(payload: {
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string | null;
}) {
  try {
    await db
      .insert(reviews)
      .values(payload)
      .onConflictDoUpdate({
        target: [reviews.product_id, reviews.user_id],
        set: { rating: payload.rating, comment: payload.comment ?? null },
      });
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbDeleteReview(reviewId: string, userId: string) {
  try {
    await db
      .delete(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.user_id, userId)));
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

// ---- Categories admin ------------------------------------------------------
export async function dbUpsertCategory(payload: {
  id?: string | null;
  name: string;
  slug: string;
  description: string | null;
}) {
  try {
    const { id, ...rest } = payload;
    if (id) {
      await db.update(categories).set(rest).where(eq(categories.id, id));
    } else {
      await db.insert(categories).values(rest);
    }
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}

export async function dbDeleteCategory(id: string) {
  try {
    await db.delete(categories).where(eq(categories.id, id));
    return ok(null);
  } catch (e) {
    return err(String(e));
  }
}
