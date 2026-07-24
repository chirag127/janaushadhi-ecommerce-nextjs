/**
 * Browser auth stub — replaces the former InsForge browser client.
 * No-op until Better Auth is wired.
 */
export function createClient() {
  return {
    auth: {
      getCurrentUser: async () => ({ data: { user: null } }),
    },
  };
}
