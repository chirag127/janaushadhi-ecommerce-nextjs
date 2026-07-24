import { neonAuth } from "@/lib/auth";

export default neonAuth.middleware({ loginUrl: "/login" });

export const config = {
  // Auth ONLY on paths that need a signed-in user. The storefront (/, /products,
  // /categories, /search, product pages) stays 100% public — no-auth on free surfaces.
  matcher: ["/account/:path*", "/checkout/:path*", "/admin/:path*", "/orders/:path*"],
};
