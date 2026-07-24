"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { neonAuth } from "@/lib/auth";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations";

export type ActionState = { error?: string; success?: string } | null;

/**
 * OAuth — returns nothing; client calls authClient.signIn.social directly
 * and handles the redirect. Kept for backward-compat shape only.
 */
export async function startOAuth(): Promise<{ url?: string; error?: string }> {
  // Real OAuth is handled client-side in oauth-buttons.tsx via authClient.signIn.social.
  return {};
}

export async function signIn(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }
  const redirectTo = (formData.get("redirect") as string) || "/account";

  const { error } = await neonAuth.signIn.email({
    email: parsed.data.email,
    password: parsed.data.password,
    callbackURL: redirectTo,
  });

  if (error) {
    return { error: (error as { message?: string }).message ?? "Sign-in failed." };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signUp(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { error } = await neonAuth.signUp.email({
    name: parsed.data.fullName,
    email: parsed.data.email,
    password: parsed.data.password,
    callbackURL: "/account",
  });

  if (error) {
    return { error: (error as { message?: string }).message ?? "Registration failed." };
  }

  return { success: "Account created! Check your email to verify, then sign in." };
}

export async function verifyEmail(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = formData.get("token") as string | null;
  if (!token) return { error: "Verification token missing." };

  const { error } = await neonAuth.verifyEmail({ query: { token } });
  if (error) {
    return { error: (error as { message?: string }).message ?? "Verification failed." };
  }
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function signOut() {
  await neonAuth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const redirectTo =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "") + "/account/reset-password";

  const { error } = await neonAuth.requestPasswordReset({
    email: parsed.data.email,
    redirectTo,
  });

  if (error) {
    return { error: (error as { message?: string }).message ?? "Failed to send reset email." };
  }
  return { success: "Reset link sent — check your inbox." };
}

export async function resetPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = formData.get("token") as string | null;
  const parsed = resetPasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  if (!token) return { error: "Reset token missing." };

  const { error } = await neonAuth.resetPassword({ newPassword: parsed.data.password, token });
  if (error) {
    return { error: (error as { message?: string }).message ?? "Password reset failed." };
  }
  return { success: "Password updated. You can now sign in." };
}

export async function updateProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { updateProfile: adminUpdateProfile } = await import("@/app/actions/admin");
  return adminUpdateProfile(_prev, formData);
}
