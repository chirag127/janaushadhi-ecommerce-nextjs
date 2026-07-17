import { NextResponse, type NextRequest } from "next/server";
import {
  updateSession,
  getAccessTokenCookieName,
} from "@insforge/sdk/ssr/middleware";

/**
 * Edge-safe session refresh + coarse route guard.
 *
 * `updateSession()` refreshes the InsForge access-token cookie (using the
 * httpOnly refresh token) so Server Components see a fresh session before
 * rendering. It is intentionally lightweight and Edge-runtime friendly — it
 * does NOT pull in the full SDK client.
 *
 * The authoritative auth + admin-role checks run in the route layouts /
 * pages (Node runtime) via getUser()/getProfile(); this middleware only does
 * an inexpensive "is there any access token?" redirect so unauthenticated
 * users are bounced to /login without a wasted render.
 */
export async function updateInsForgeSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  // Next's RequestCookies/ResponseCookies satisfy the SDK's cookie reader /
  // writer contract at runtime; the cast reconciles the overloaded `set`
  // signature difference between the two type definitions.
  const { accessToken } = await updateSession({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  } as unknown as Parameters<typeof updateSession>[0]);

  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith("/account") ||
    path.startsWith("/checkout") ||
    path.startsWith("/admin");

  if (!isProtected) return response;

  // Fall back to reading the (possibly just-written) cookie when updateSession
  // did not itself return a token.
  const cookieName = getAccessTokenCookieName();
  const hasToken =
    Boolean(accessToken) ||
    Boolean(response.cookies.get(cookieName)?.value) ||
    Boolean(request.cookies.get(cookieName)?.value);

  if (!hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url, { headers: response.headers });
  }

  return response;
}
