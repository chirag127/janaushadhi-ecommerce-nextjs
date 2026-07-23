# Jan Aushadhi Ecommerce (Next.js)

A full-stack, production-ready ecommerce storefront for affordable generic
medicines, built with **Next.js 15 (App Router)**, **InsForge**
(Postgres + Auth + Storage + RLS + managed Razorpay payments), **TypeScript**,
and **Tailwind CSS**.

One of the four-framework Jan Aushadhi build (astro / nextjs / laravel /
wordpress), all backed by one shared InsForge project `janaushadhi-shared`.

## Features

### Storefront
- Landing page (hero, value props, categories, featured products)
- Catalog with search, category filter, price range, sorting, pagination
- Product detail (image, stock, related products, reviews, JSON-LD)
- Cart with quantity controls + free-shipping progress
- Checkout with saved addresses, coupon codes, Razorpay / COD
- Order confirmation + order history, wishlist, dark/light/system theme

### Account
- Dashboard (order/address/wishlist counts), orders, address book (CRUD),
  wishlist, profile

### Admin (`role = admin`)
- Dashboard (revenue, orders, products, customers, low-stock)
- Products CRUD, categories, coupons (percent/fixed, min order, usage/expiry),
  orders + status, inventory

### Platform
- SSR auth (email/password + OAuth callback), middleware session refresh +
  route guards (`/account`, `/checkout`, `/admin`), RLS on every table, Server
  Actions for all mutations, `sitemap.xml` / `robots.txt`

## Setup

```bash
npm install
cp .env.example .env.local   # fill InsForge URL + anon key
npm run dev                  # http://localhost:3000
npm run build
npm run type-check
```

Env values (`.env.local`):

- `NEXT_PUBLIC_INSFORGE_URL` = `oss_host` from `.insforge/project.json`
- `NEXT_PUBLIC_INSFORGE_ANON_KEY` = `npx @insforge/cli secrets get ANON_KEY`
  (RLS-protected — safe in browser)
- `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` = site origin
- `NEXT_PUBLIC_RAZORPAY_TEST_MODE` = `"true"` (test) / `"false"` (live)

## Razorpay

Configured on the InsForge backend (keys not in env):

```bash
npx @insforge/cli payments razorpay config set --environment test \
  --key-id rzp_test_xxx --key-secret xxx
```

Until configured, checkout places orders as Cash-on-Delivery.

## Backend

Shared InsForge project. Schema (13 tables, RLS, enums `discount_type`
`percent|fixed`, `order_status`, `payment_status`, `user_role`) + 2,439-medicine
catalog live in the project. `orders.shipping_address` is jsonb (address snapshot
+ `_payment_method`); coupons use `max_discount_amount` / `min_order_amount`.
