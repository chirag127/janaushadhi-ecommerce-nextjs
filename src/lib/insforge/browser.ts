import { createBrowserClient } from "@insforge/sdk/ssr";

/**
 * Browser InsForge client. Safe to use in Client Components.
 *
 * Reads the `insforge_access_token` cookie for SDK calls / Realtime and
 * refreshes through `/api/auth/refresh` when the access token is missing,
 * expired, near expiry, or rejected. Its auth surface is read-only
 * (`getCurrentUser` / `getProfile`); perform auth mutations on the server
 * via `createAuthActions()` (see src/lib/insforge/auth-actions.ts).
 */
export function createClient() {
  return createBrowserClient();
}
