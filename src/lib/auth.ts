import { createNeonAuth } from "@neondatabase/auth/next/server";
import { db } from "@/lib/db/client";
import { profiles, users } from "@/lib/db/schema";
import { dbGetProfile } from "@/lib/db/repository";
import type { Profile } from "@/lib/types";

export const neonAuth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    domain: process.env.NEON_AUTH_COOKIE_DOMAIN,
  },
});

export type AuthUser = {
  id: string;
  email: string | null;
};

/** Alias used by storefront pages. */
export async function getUser(): Promise<AuthUser | null> {
  return getSessionUser();
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const { data: session, error } = await neonAuth.getSession();
  if (error || !session?.user) return null;
  const u = session.user;
  await upsertLocalUser(u.id, (u as { email?: string }).email ?? null);
  return { id: u.id, email: (u as { email?: string }).email ?? null };
}

/** Upsert into local `users` + `profiles` tables keyed by Better Auth subject id. */
async function upsertLocalUser(id: string, email: string | null) {
  if (!email) return; // users.email is NOT NULL; skip if hub omits it
  try {
    await db.insert(users).values({ id, email }).onConflictDoNothing();
    await db.insert(profiles).values({ id }).onConflictDoNothing();
  } catch {
    // Non-fatal — best effort
  }
}

export async function getProfile(): Promise<Profile | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const { data } = await dbGetProfile(user.id);
  return data ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}
