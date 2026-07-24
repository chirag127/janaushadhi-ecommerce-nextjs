"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Auth actions — stubbed pending Better Auth (oriz-accounts) integration.
 *
 * InsForge auth (signIn/signUp/signOut/OAuth/email-verify/reset) is removed.
 * All exported functions return sensible errors so pages that reference them
 * compile and surface a "coming soon" message at runtime. Replace the bodies
 * when Better Auth is wired.
 */
export type ActionState = { error?: string; success?: string } | null;

export async function startOAuth(
  _provider: string,
  _next: string
): Promise<{ url?: string; error?: string }> {
  return { error: "OAuth sign-in is not available yet. Please use email & password." };
}

export async function signIn(
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  return { error: "Sign-in is not available yet — auth migration in progress." };
}

export async function signUp(
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  return { error: "Registration is not available yet — auth migration in progress." };
}

export async function verifyEmail(
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  return { error: "Email verification is not available yet." };
}

export async function signOut() {
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPassword(
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  return { error: "Password reset is not available yet." };
}

export async function resetPassword(
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  return { error: "Password reset is not available yet." };
}

export async function updateProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Delegate to the admin action which has the real implementation.
  const { updateProfile: adminUpdateProfile } = await import("@/app/actions/admin");
  return adminUpdateProfile(_prev, formData);
}
