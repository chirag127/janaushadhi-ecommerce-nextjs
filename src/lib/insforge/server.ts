import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";

/**
 * Server InsForge client for Server Components, Route Handlers and
 * Server Actions. Reads the access-token cookie and passes it as the
 * per-request bearer token; the refresh token stays server-owned.
 *
 * Uses the Next.js 15 async cookies() API.
 */
export async function createClient() {
  return createServerClient({
    cookies: await cookies(),
  });
}
