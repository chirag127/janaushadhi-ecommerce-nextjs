/**
 * Re-exports getSessionUser from the real auth layer (Neon Managed Better Auth).
 * Kept as a thin shim so existing imports of getSessionUser continue to work.
 */
export { getSessionUser, type AuthUser } from "@/lib/auth";
