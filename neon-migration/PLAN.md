# Neon migration plan — janaushadhi-nextjs

Groundwork done 2026-07-24. The **live app still runs on InsForge, untouched.**
This directory holds a Neon DB with the schema already applied plus the cutover
plan. Nothing here changes app runtime yet.

Neon project: `tiny-lab-09156851` (org `org-old-mode-74272352`), branch `main`
(`br-summer-firefly-aypd4kjg`), db `neondb`.

## Done (this groundwork pass)

- `neon link` + `neon env pull` → `DATABASE_URL`, `DATABASE_URL_UNPOOLED`,
  `NEON_BRANCH` written to `.env.local` (gitignored — verified).
- `neon-migration/schema.sql` — 10 tables + 4 enums, ported from the live
  InsForge schema (`src/lib/types.ts` + every `.from("...")` call).
- Schema **applied to Neon and verified**: tables `addresses, cart_items,
  categories, coupons, order_items, orders, products, profiles, reviews,
  wishlist_items`; enums `discount_type, order_status, payment_status,
  user_role`. Applied via the Neon HTTP serverless driver over :443 — the corp
  firewall blocks raw Postgres :5432, so `psql`/`pg` TCP fails here; use the
  serverless (HTTP) driver or `neon` CLI, not a direct TCP client.

## What is ported vs what stays

Ported: **the full relational schema only** (DDL). NOT ported: any data,
auth users, RLS policies, payment config, or app code. The InsForge project
(`ht574p3t`, `janaushadhi-shared`) and all its code remain the source of truth
until cutover.

Schema note — InsForge modelled users in its own auth table and `profiles`
1:1'd them. On Neon, **Better Auth owns the user table**. `profiles.id` is left
as a standalone uuid PK; wire `profiles.id → <betterauth users>.id` FK once the
Better Auth table name is fixed (step 2 below). All `user_id` FKs currently
point at `profiles(id)`.

## What REMAINS to fully cut over

1. **Swap the data client (InsForge SDK → Neon).** 35 files import
   `@insforge/sdk` / `@/lib/insforge`. Replace the three clients in
   `src/lib/insforge/{server,browser,middleware}.ts` and rewrite the
   `insforge.database.from("t").select()...` query builder calls. Two options:
   - Neon serverless driver (`@neondatabase/serverless`) + hand-written SQL, or
   - a query builder (Drizzle/Kysely) over the Neon driver.
   The builder chains live mostly in `src/lib/queries.ts`, `src/lib/cart.ts`,
   `src/lib/reviews.ts`, and `src/app/actions/*.ts` (address, admin, auth, cart,
   order, review, wishlist). InsForge `.select("*")`/`.eq()`/`.maybeSingle()`/
   `.order()` semantics must be reproduced. **RLS was enforced by InsForge**;
   Neon Postgres has no per-request RLS via the SDK — enforce ownership in the
   server actions (every `user_id = <session user>` check) or add Postgres RLS
   with a session GUC. Do not lose the ownership checks.

2. **Rebuild auth on Neon Better Auth.** Replace `@insforge/sdk/ssr`
   auth (`src/lib/insforge/auth-actions.ts`, `src/lib/auth.ts`,
   `src/app/actions/auth.ts`, `src/app/api/auth/refresh/route.ts`,
   `src/app/auth/callback/route.ts`, `src/middleware.ts` guard). Map:
   sign-up/in/out, email verify, password reset, OAuth callback, session
   refresh, and the admin-role gate (`profiles.role = 'admin'`). Then add the
   `profiles.id → betterauth user id` FK and a create-profile-on-signup hook.

3. **Hand-wire Razorpay** (per `neon-gap-mitigation-2026-07-24`). Neon has NO
   built-in payments. Today `src/app/actions/order.ts` finalizes everything as
   COD (Razorpay is a documented placeholder). Add a Next.js route (Vercel) or
   CF Worker: create Razorpay order, load Checkout JS client-side, verify the
   webhook signature server-side, update `orders.payment_status`/`status`. Test
   mode by default (`NEXT_PUBLIC_RAZORPAY_TEST_MODE`). Keys via env, never
   committed. COD path already works and needs no payment provider.

4. **Re-seed the catalog.** `meds.csv` (+ `scripts/meds.csv`) is the product
   source. Write a Neon seed (tsx script using the serverless driver over :443)
   to load `categories` + `products` (`drug_code`, `slug`, `mrp`, `price`,
   `unit_size`, ...). Existing InsForge product/category/coupon rows can also be
   exported and imported if preserving ids matters.

5. **Update env + example.** Drop `NEXT_PUBLIC_INSFORGE_URL` /
   `NEXT_PUBLIC_INSFORGE_ANON_KEY`; add `DATABASE_URL` (+ Better Auth secret,
   Razorpay keys) to `.env.local` and mirror documented placeholders in
   `.env.example`. Remove `@insforge/sdk` from `package.json`; add the Neon
   driver / Better Auth / query-builder deps.

6. **Redeploy.** Vercel (`vercel.json` present). Set the new env vars in the
   Vercel project, deploy, smoke-test: browse catalog, auth, cart, checkout
   (COD + Razorpay test), admin, reviews, wishlist.

## Risks

- **RLS loss.** InsForge enforced row ownership server-side; the Neon SDK does
  not. Every ownership check must be reproduced in server actions (or via
  Postgres RLS + session GUC) or users could read/write others' cart, orders,
  addresses, reviews. Highest-risk item.
- **Auth surface breadth.** Better Auth ≠ InsForge auth 1:1 — email verify,
  password reset, OAuth callback, and edge-safe session refresh in middleware
  all need re-implementation and testing. Session cookie names change.
- **Corp-network :5432 block.** All schema/seed/migration tooling must use the
  Neon HTTP serverless driver (or `neon` CLI) — a raw `pg`/`psql` TCP connection
  times out from this environment.
- **Payments correctness.** Razorpay signature verification and webhook
  idempotency must be server-side and exact, or orders can be marked
  paid/unpaid incorrectly.
- **Data fidelity on re-seed.** Regenerated uuids break any external references;
  export/import if id stability matters. Numeric price/mrp precision preserved
  as `numeric(10,2)`.
- **No rollback coupling.** Keep the InsForge project live until the Neon build
  is fully smoke-tested; cut DNS/deploy over only then.

## Note on the other janaushadhi apps

- **laravel** — needs the same schema plus its Laravel-specific tables
  (`laravel_*`: sessions, cache, jobs, migrations, password_reset_tokens) on its
  own Neon DB.
- **wordpress** — no app code (CSV + theme). Needs **no Neon DB** unless taken
  headless. Status: planned, no DB required as-is.
