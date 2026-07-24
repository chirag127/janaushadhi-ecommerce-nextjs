/**
 * OAuth callback stub — pending Better Auth.
 * Redirects to /login?error=oauth until the real exchange is wired.
 */
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { origin } = request.nextUrl;
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
