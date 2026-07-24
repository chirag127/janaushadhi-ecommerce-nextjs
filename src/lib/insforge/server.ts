/**
 * Server auth stub — replaces the former InsForge server client.
 * Returns a minimal object whose .auth.getCurrentUser() always resolves to
 * { data: { user: null } } until Better Auth is wired.
 *
 * DB access is gone — use src/lib/db/repository directly instead.
 */
export async function createClient() {
  return {
    auth: {
      getCurrentUser: async () => ({ data: { user: null } }),
    },
  };
}
