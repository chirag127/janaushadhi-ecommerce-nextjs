import { createClient } from "@/lib/insforge/server";
import type { Profile } from "@/lib/types";

/**
 * Returns the authenticated user (validated) or null.
 */
export async function getUser() {
  const insforge = await createClient();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();
  return user;
}

/**
 * Returns the user's profile (incl. role) or null.
 */
export async function getProfile(): Promise<Profile | null> {
  const insforge = await createClient();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();
  if (!user) return null;

  const { data } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}
