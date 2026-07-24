import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  jsonb,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---- Enums -----------------------------------------------------------------
export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "created",
  "pending",
  "captured",
  "failed",
  "refunded",
]);
export const discountTypeEnum = pgEnum("discount_type", ["percent", "fixed"]);

// ---- Tables ----------------------------------------------------------------
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  full_name: text("full_name"),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("customer"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image_url: text("image_url"),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  drug_code: text("drug_code").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  unit_size: text("unit_size"),
  mrp: numeric("mrp", { precision: 10, scale: 2 }).notNull().default("0"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  category_id: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  description: text("description"),
  image_url: text("image_url"),
  stock: integer("stock").notNull().default(0),
  is_featured: boolean("is_featured").notNull().default(false),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  full_name: text("full_name").notNull(),
  phone: text("phone").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  country: text("country").default("India"),
  is_default: boolean("is_default").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cart_items = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.user_id, t.product_id)]
);

export const wishlist_items = pgTable(
  "wishlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.user_id, t.product_id)]
);

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discount_type: discountTypeEnum("discount_type").notNull().default("percent"),
  discount_value: numeric("discount_value", { precision: 10, scale: 2 }).notNull().default("0"),
  min_order_amount: numeric("min_order_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  max_discount_amount: numeric("max_discount_amount", { precision: 10, scale: 2 }),
  usage_limit: integer("usage_limit"),
  used_count: integer("used_count").notNull().default(0),
  per_user_limit: integer("per_user_limit"),
  starts_at: timestamp("starts_at", { withTimezone: true }),
  expires_at: timestamp("expires_at", { withTimezone: true }),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_number: text("order_number").notNull().unique(),
  user_id: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  status: orderStatusEnum("status").notNull().default("pending"),
  payment_status: paymentStatusEnum("payment_status").notNull().default("created"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  shipping: numeric("shipping", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("INR"),
  coupon_id: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
  shipping_address: jsonb("shipping_address"),
  razorpay_order_id: text("razorpay_order_id"),
  razorpay_payment_id: text("razorpay_payment_id"),
  is_test_payment: boolean("is_test_payment").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const order_items = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    order_id: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    product_id: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    product_name: text("product_name").notNull(),
    unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull().default("0"),
    quantity: integer("quantity").notNull().default(1),
    line_total: numeric("line_total", { precision: 10, scale: 2 }).notNull().default("0"),
  },
  (t) => [check("quantity_positive", sql`${t.quantity} > 0`)]
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    user_id: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: text("title"),
    comment: text("comment"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.product_id, t.user_id),
    check("rating_range", sql`${t.rating} between 1 and 5`),
  ]
);

export const blog_posts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content"),
  published: boolean("published").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contact_messages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coupon_redemptions = pgTable("coupon_redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  coupon_id: uuid("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  order_id: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
