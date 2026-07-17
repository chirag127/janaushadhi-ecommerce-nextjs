# Jan Aushadhi Ecommerce

A full-stack, production-ready ecommerce storefront for affordable generic
medicines, built with **Next.js 15 (App Router)**, **Supabase**
(Postgres + Auth + Storage + RLS), **TypeScript**, and **Tailwind CSS**.

It ships a complete customer storefront, a customer account area, and a
role-gated admin panel — all backed by Row Level Security.

---

## Features

### Storefront
- Landing page with hero, value props, categories, and featured products
- Product catalog with search, category filter, price range, and sorting
- Product detail pages with image, stock, related products, reviews, and
  JSON-LD structured data
- Category browsing
- Cart with quantity controls and free-shipping progress
- Checkout with saved addresses, coupon codes, and payment method selection
- Order confirmation + order history
- Wishlist
- Dark / light / system theme

### Account
- Dashboard with order, address, and wishlist counts
- Orders list + order detail
- Address book (CRUD, default address)
- Wishlist management
- Profile editing

### Admin (role = `admin`)
- Dashboard: revenue, orders, products, customers, low-stock alerts
- Products: create / edit / delete, search, pagination
- Categories: CRUD with product counts
- Orders: list, filter by status, view detail, update status
- Coupons: CRUD (percentage / fixed, min order, usage limit, expiry)
- Inventory: inline stock editing with low/out-of-stock filters

### Platform
- Supabase SSR auth (email/password, password reset) via `@supabase/ssr`
- Middleware-based session refresh and route protection
  (`/account`, `/checkout`, `/admin`)
- Row Level Security on every table; admin writes gated by `public.is_admin()`
- SEO: dynamic metadata, `sitemap.xml`, `robots.txt`
- Server Actions for all mutations (auth, cart, wishlist, orders, reviews,
  addresses, admin)

---

## Tech Stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 15 (App Router, Server Actions)            |
| Language   | TypeScript                                         |
| Styling    | Tailwind CSS + CSS variables (light/dark)          |
| Backend    | Supabase (Postgres, Auth, Storage, RLS)            |
| Icons      | lucide-react                                       |
| Toasts     | sonner                                             |
| Theme      | next-themes                                        |
| Validation | zod                                                |

---

## Project Structure

```
src/
  app/
    (auth)/            login, register, forgot-password  (redirects if signed in)
    (storefront)/      home, products, categories, cart, checkout,
                       order-confirmation, account/*
    admin/             role-gated admin panel
    actions/           server actions (auth, cart, wishlist, order,
                       review, address, admin)
    auth/callback/     Supabase auth callback route handler
    api/               route handlers (e.g. search autocomplete)
    sitemap.ts, robots.ts, layout.tsx, not-found.tsx, error.tsx,
    global-error.tsx
  components/
    ui/                primitives (button, card, input, select, ...)
    storefront/        product cards, filters, cart, checkout, reviews
    account/           account nav, address + profile forms
    admin/             admin nav, managers, dialogs
  lib/
    supabase/          server.ts, client.ts, middleware.ts
    auth.ts, queries.ts, cart.ts, reviews.ts, types.ts, utils.ts, site.ts
  middleware.ts
supabase/
  migrations/          0001_schema, 0002_rls, 0003_storage, 0004_functions
scripts/
  meds.csv, seed.ts    CSV -> categories + products seeder
```

---

## Getting Started

### 1. Prerequisites
- Node.js 18.18+ (20+ recommended)
- A Supabase project (free tier is fine)

### 2. Install
```bash
npm install
```

### 3. Environment
Copy `.env.example` to `.env.local` and fill in your Supabase credentials.
`.env.example` contains detailed, step-by-step instructions for locating each
value in the Supabase dashboard.

```bash
cp .env.example .env.local
```

Supabase uses **new prefixed API keys** (recommended). The app also accepts the
legacy JWT keys as a fallback, so either set works:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co

# New keys (preferred)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # browser-safe
SUPABASE_SECRET_KEY=sb_secret_...                         # server only

# Public site URL (SEO, sitemap, auth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

| Env var | Supabase key | Format | Exposure |
| ------- | ------------ | ------ | -------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | `https://<ref>.supabase.co` | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (new) → replaces `anon` | `sb_publishable_...` | Browser-safe |
| `SUPABASE_SECRET_KEY` | Secret (new) → replaces `service_role` | `sb_secret_...` | **Server only** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy `anon` (fallback) | JWT `eyJ...` | Browser-safe |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy `service_role` (fallback) | JWT `eyJ...` | **Server only** |

**Where to find them:** Dashboard → **Settings → API Keys** →
*Publishable and secret* tab (click **Create new API keys** once if your project
is still on legacy-only keys). The Project URL is under
**Settings → Data API**. The secret key bypasses Row Level Security — treat it
like a password and never prefix it with `NEXT_PUBLIC_`.

### 4. Database
Run the migrations **in order** in the Supabase SQL editor
(or via the Supabase CLI):

```
supabase/migrations/0001_schema.sql
supabase/migrations/0002_rls.sql
supabase/migrations/0003_storage.sql
supabase/migrations/0004_functions.sql
```

These create the schema, enable Row Level Security with policies, set up the
product-image storage bucket, and add analytics RPCs used by the admin
dashboard. A trigger (`handle_new_user`) auto-creates a `profiles` row for every
new auth user with the default role `customer`.

### 5. Seed products
Populates `categories` and `products` from `scripts/meds.csv`
using the service-role key:

```bash
npm run seed
```

### 6. Run
```bash
npm run dev
```
Open http://localhost:3000.

---

## Creating an Admin User

1. Register a normal account through the app (`/register`).
2. In the Supabase SQL editor, promote that user:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

3. Sign in and visit `/admin`. Non-admins are redirected away by middleware
   and the admin layout.

---

## Scripts

| Command             | Description                                        |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Start the dev server                               |
| `npm run build`     | Production build (forces `NODE_ENV=production`)    |
| `npm run start`     | Start the production server                        |
| `npm run lint`      | Run ESLint                                         |
| `npm run type-check`| TypeScript type checking (`tsc --noEmit`)          |
| `npm run seed`      | Seed categories + products from CSV                |

> **Note:** `npm run build` uses `cross-env NODE_ENV=production` because a
> stray ambient `NODE_ENV=development` makes Next.js prerender error pages with
> the development React renderer, which fails the build. Keeping it explicit
> makes the build robust in any shell.

---

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Add the environment variables from `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL` = your production URL).
   If you are still on legacy keys, use `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY` instead.
4. In Supabase → Authentication → URL Configuration, add your production URL to
   **Site URL** and **Redirect URLs** (include `/auth/callback`).
5. Deploy. Run the migrations and (optionally) the seed against your
   production Supabase project.

The app is fully serverless-friendly: pages that touch auth/cookies are
server-rendered on demand; catalog metadata (`sitemap`, `robots`) is generated
per request.

---

## Security Notes
- All tables use RLS. Customers can only read/write their own rows; admin
  writes are gated by the `is_admin()` SECURITY DEFINER function.
- The app uses the **publishable/anon** key everywhere in the request path
  (browser, server components, middleware) — RLS does the enforcement. No
  elevated key is used to serve pages.
- The **secret/service_role** key is only used server-side by the seed script.
  It bypasses RLS and must never be exposed to the browser or prefixed with
  `NEXT_PUBLIC_`.
- Key resolution lives in `src/lib/supabase/config.ts`, which prefers the new
  `sb_publishable_` / `sb_secret_` keys and falls back to the legacy
  `anon` / `service_role` JWTs.
- Middleware validates the session with `supabase.auth.getUser()` on every
  request to protected routes.
