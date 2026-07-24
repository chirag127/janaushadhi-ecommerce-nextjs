/**
 * Middleware auth stub — replaces InsForge session refresh middleware.
 * Performs coarse route-guard redirect (token cookie → Better Auth session
 * check when wired; for now redirects all protected routes to /login).
 */
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/account", "/checkout", "/admin"];

export async function updateInsForgeSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  if (!isProtected) return response;

  // Until Better Auth is wired, all protected routes redirect to /login.
  // Replace this condition with a real session check when Better Auth lands.
  const hasSession = false; // TODO: check Better Auth session cookie
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url, { headers: response.headers });
  }

  return response;
}
