import { createRefreshAuthRouter } from "@insforge/sdk/ssr";

/**
 * Browser access-token refresh endpoint. The InsForge SSR browser client
 * calls POST /api/auth/refresh when its access token is missing / expired.
 */
export const { POST } = createRefreshAuthRouter();
