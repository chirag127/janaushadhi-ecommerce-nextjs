-- Jan Aushadhi Ecommerce (Next.js) — Neon Postgres schema
-- Ported from the live InsForge schema (see src/lib/types.ts + src/**/*.from("...")).
-- Plain Postgres DDL, idempotent. Auth is NOT modelled here: on Neon it will be
-- rebuilt with Better Auth, which owns its own user table. profiles.id is the
-- app-level user id and is intended to 1:1 the Better Auth user id (wire the FK
-- once the auth table name is fixed). Until then profiles stands alone.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- enums --------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('customer','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum
    ('pending','paid','processing','shipped','delivered','cancelled','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum
    ('created','pending','captured','failed','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type discount_type as enum ('percent','fixed');
exception when duplicate_object then null; end $$;

-- profiles -----------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key default gen_random_uuid(),
  full_name   text,
  phone       text,
  role        user_role   not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- categories ---------------------------------------------------------------
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);

-- products -----------------------------------------------------------------
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  drug_code   text not null,
  name        text not null,
  slug        text not null unique,
  unit_size   text,
  mrp         numeric(10,2) not null default 0,
  price       numeric(10,2) not null default 0,
  category_id uuid references categories(id) on delete set null,
  description text,
  image_url   text,
  stock       integer     not null default 0,
  is_featured boolean     not null default false,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists products_category_id_idx on products(category_id);
create index if not exists products_is_active_idx   on products(is_active);
create index if not exists products_is_featured_idx on products(is_featured);

-- addresses ----------------------------------------------------------------
create table if not exists addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  full_name   text not null,
  phone       text not null,
  line1       text not null,
  line2       text,
  city        text not null,
  state       text not null,
  pincode     text not null,
  country     text default 'India',
  is_default  boolean     not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists addresses_user_id_idx on addresses(user_id);

-- cart_items ---------------------------------------------------------------
create table if not exists cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  quantity    integer     not null default 1 check (quantity > 0),
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists cart_items_user_id_idx on cart_items(user_id);

-- wishlist_items -----------------------------------------------------------
create table if not exists wishlist_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists wishlist_items_user_id_idx on wishlist_items(user_id);

-- coupons ------------------------------------------------------------------
create table if not exists coupons (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  description         text,
  discount_type       discount_type not null default 'percent',
  discount_value      numeric(10,2) not null default 0,
  min_order_amount    numeric(10,2) not null default 0,
  max_discount_amount numeric(10,2),
  usage_limit         integer,
  used_count          integer     not null default 0,
  per_user_limit      integer,
  starts_at           timestamptz,
  expires_at          timestamptz,
  is_active           boolean     not null default true,
  created_at          timestamptz not null default now()
);

-- orders -------------------------------------------------------------------
create table if not exists orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text not null unique,
  user_id             uuid not null references profiles(id) on delete restrict,
  status              order_status   not null default 'pending',
  payment_status      payment_status not null default 'created',
  subtotal            numeric(10,2) not null default 0,
  discount            numeric(10,2) not null default 0,
  shipping            numeric(10,2) not null default 0,
  total               numeric(10,2) not null default 0,
  currency            text not null default 'INR',
  coupon_id           uuid references coupons(id) on delete set null,
  shipping_address    jsonb,
  razorpay_order_id   text,
  razorpay_payment_id text,
  is_test_payment     boolean     not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists orders_user_id_idx on orders(user_id);
create index if not exists orders_status_idx  on orders(status);

-- order_items --------------------------------------------------------------
create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  product_name text not null,
  unit_price   numeric(10,2) not null default 0,
  quantity     integer not null default 1 check (quantity > 0),
  line_total   numeric(10,2) not null default 0
);
create index if not exists order_items_order_id_idx on order_items(order_id);

-- reviews ------------------------------------------------------------------
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  title       text,
  comment     text,
  created_at  timestamptz not null default now(),
  unique (product_id, user_id)
);
create index if not exists reviews_product_id_idx on reviews(product_id);
