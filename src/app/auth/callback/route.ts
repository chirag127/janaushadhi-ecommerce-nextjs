import { NextResponse, type NextRequest } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";

/**
 * OAuth callback handler. InsForge appends `?insforge_code=<code>` to the
 * configured redirect URL after the provider authorises the user. We exchange
 * the code for a session on the server (writing httpOnly refresh + readable
 * access cookies) and redirect into the app.
 *
 * GET /auth/callback?insforge_code=...&next=/account
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("insforge_code");
  const oauthError = searchParams.get("error");
  const next = searchParams.get("next") ?? "/account";

  if (oauthError || !code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  const codeVerifier = request.cookies.get("insforge_code_verifier")?.value;

  const auth = createAuthActions({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const { error } = await auth.exchangeOAuthCode(code, codeVerifier);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  // Clean up the PKCE verifier cookie.
  response.cookies.delete("insforge_code_verifier");
  return response;
}
