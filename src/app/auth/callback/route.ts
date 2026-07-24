import { NextResponse, type NextRequest } from "next/server";

/**
 * OAuth callback landing page.
 * Better Auth completes the OAuth exchange at /api/auth/callback/:provider.
 * This route handles any leftover redirects (e.g. from old bookmarks) by
 * sending the user to /account (or the `next` query param if present).
 */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") ?? "/account";
  const { origin } = request.nextUrl;
  return NextResponse.redirect(`${origin}${next}`);
}
