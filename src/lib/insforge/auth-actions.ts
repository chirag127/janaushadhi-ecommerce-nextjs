import { cookies } from "next/headers";
import { createAuthActions, createServerClient } from "@insforge/sdk/ssr";

/**
 * Server-side auth-mutation helpers. `createAuthActions()` writes / clears the
 * `insforge_access_token` (browser-readable) and `insforge_refresh_token`
 * (httpOnly) cookies using the Next.js cookie store, so sign-in / sign-up /
 * verify / sign-out flows establish or clear the session correctly.
 */
export async function createInsForgeAuthActions() {
  return createAuthActions({ cookies: await cookies() });
}

/**
 * Full server client (complete auth surface) for auth reads and for the
 * password-reset flow (`sendResetPasswordEmail` / `resetPassword`), which are
 * not part of the AuthActions surface.
 */
export async function createInsForgeAuthClient() {
  return createServerClient({ cookies: await cookies() });
}
