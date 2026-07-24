# janaushadhi-ecommerce-nextjs

[![GitHub stars](https://img.shields.io/github/stars/chirag127/janaushadhi-ecommerce-nextjs?style=flat)](https://github.com/chirag127/janaushadhi-ecommerce-nextjs/stargazers)

**Live:** https://janaushadhi-nextjs.oriz.in

Jan Aushadhi generic-medicine e-commerce storefront built with Next.js 15, deployed on Cloudflare Workers via OpenNext.

One of four framework variants (astro / nextjs / laravel / wordpress) sharing one Neon Postgres project `janaushadhi`.

## Features

**Storefront:** landing page, product catalog (search, category filter, price range, sort, pagination), product detail (reviews, related products, JSON-LD), cart with free-shipping progress, checkout (saved addresses + coupon codes + Razorpay / COD), order confirmation, order history, wishlist, dark/light/system theme.

**Account:** dashboard (order/address/wishlist counts), orders, address book (CRUD), wishlist, profile.

**Admin (`role = admin`):** dashboard (revenue, orders, products, customers, low-stock), products CRUD, categories, coupons (percent/fixed, min order, usage limit, expiry), orders + status management, inventory.

**Platform:** SSR auth (email/password + OAuth), middleware session refresh + route guards (`/account`, `/checkout`, `/admin`), Server Actions for all mutations, `sitemap.xml`, `robots.txt`.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, SSR) |
| Deployment | OpenNext (`@opennextjs/cloudflare`) → Cloudflare Workers |
| Database | Neon Postgres + Drizzle ORM |
| Auth | Neon Managed Better Auth (`@neondatabase/auth`) |
| Payments | Razorpay (test mode) |
| Styling | Tailwind CSS v3, `next-themes`, Lucide icons |
| Language | TypeScript 5 |

## Local Development

```bash
pnpm install
cp .env.example .env.local   # fill in values — see Environment Variables below
pnpm dev                     # http://localhost:3000
```

Other scripts:

```bash
pnpm build        # production build via opennext
pnpm lint         # ESLint
pnpm type-check   # tsc --noEmit
```

## Deployment

Deploys automatically on push to `main` via GitHub Actions (`.github/workflows/deploy.yml`):

1. Builds with `opennextjs-cloudflare build`
2. Deploys with `wrangler deploy` → Cloudflare Workers
3. Pushes runtime secrets to the Worker via `wrangler secret put`

Required GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, plus the env vars listed below.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values. Never commit secret values.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled connection string for `janaushadhi` project |
| `DATABASE_URL_UNPOOLED` | Neon direct connection string (used by migrations) |
| `NEON_AUTH_BASE_URL` | Base URL of the Neon Managed Better Auth endpoint (oriz-accounts hub) |
| `NEON_AUTH_COOKIE_SECRET` | Cookie signing secret, min 32 chars (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_SITE_URL` | Public site origin used for SEO metadata, sitemap, and OAuth redirects |
| `NEXT_PUBLIC_APP_URL` | Same as `NEXT_PUBLIC_SITE_URL` (used internally by some components) |
| `NEXT_PUBLIC_RAZORPAY_TEST_MODE` | `"true"` keeps Razorpay Checkout in test mode; `"false"` for live |
| `RAZORPAY_KEY_ID` | Razorpay API key ID (set as Worker secret in production) |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret (set as Worker secret in production) |

## License

MIT
