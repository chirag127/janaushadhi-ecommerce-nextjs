/**
 * Auth-actions stub — replaces InsForge createAuthActions / createServerClient.
 * No-ops until Better Auth is wired.
 */
export async function createInsForgeAuthActions() {
  return {
    signInWithPassword: async () => ({ data: null, error: { message: "Auth not configured", statusCode: 503 } }),
    signUp: async () => ({ data: null, error: { message: "Auth not configured" } }),
    verifyEmail: async () => ({ error: { message: "Auth not configured" } }),
    signOut: async () => ({}),
    exchangeOAuthCode: async () => ({ error: { message: "Auth not configured" } }),
  };
}

export async function createInsForgeAuthClient() {
  return {
    auth: {
      signInWithOAuth: async () => ({ data: null, error: { message: "Auth not configured" } }),
      sendResetPasswordEmail: async () => ({ error: { message: "Auth not configured" } }),
      resetPassword: async () => ({ error: { message: "Auth not configured" } }),
    },
  };
}
