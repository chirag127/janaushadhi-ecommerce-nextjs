"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  createInsForgeAuthActions,
  createInsForgeAuthClient,
} from "@/lib/insforge/auth-actions";
import { createClient } from "@/lib/insforge/server";
import { loginSchema, registerSchema } from "@/lib/validations";

export type ActionState = { error?: string; success?: string } | null;

/**
 * Start an OAuth sign-in. Returns the provider URL to redirect to (client does
 * the redirect). InsForge links the same email across providers automatically.
 */
export async function startOAuth(
  provider: string,
  next: string,
): Promise<{ url?: string; error?: string }> {
  try {
    const insforge = await createInsForgeAuthClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { data, error } = await insforge.auth.signInWithOAuth(provider, {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      additionalParams: { prompt: "select_account" },
      skipBrowserRedirect: true,
    });
    if (error || !data?.url) return { error: error?.message ?? "OAuth unavailable" };
    // Bridge the PKCE verifier to the callback route via a short-lived
    // httpOnly cookie (SameSite=Lax survives the provider redirect back).
    if (data.codeVerifier) {
      (await cookies()).set("insforge_code_verifier", data.codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600,
      });
    }
    return { url: data.url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "OAuth failed" };
  }
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

  const auth = await createInsForgeAuthActions();
  const { data, error } = await auth.signInWithPassword(parsed.data);
  if (error || !data?.user) {
    // 403 => email not yet verified.
    if (error?.statusCode === 403) {
      return {
        error:
          "Please verify your email first. Check your inbox for the 6-digit code.",
      };
    }
    return { error: error?.message ?? "Sign in failed" };
  }

  const redirectTo = (formData.get("redirect") as string) || "/account";
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

  const auth = await createInsForgeAuthActions();
  const { data, error } = await auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    name: parsed.data.fullName,
  });
  if (error) return { error: error.message };

  // createAuthActions writes session cookies automatically when the backend
  // returns a session (i.e. email verification is NOT required). In that case
  // requireEmailVerification is falsy and the user is already signed in.
  if (data && data.requireEmailVerification === false) {
    redirect("/account");
  }

  // Otherwise email verification (6-digit code) is required.
  redirect(
    `/verify-email?email=${encodeURIComponent(parsed.data.email)}`
  );
}

export async function verifyEmail(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  const otp = String(formData.get("otp") || "").trim();
  if (!email || !otp) return { error: "Enter the 6-digit code from your email." };

  const auth = await createInsForgeAuthActions();
  const { error } = await auth.verifyEmail({ email, otp });
  if (error) {
    return { error: error.message ?? "Invalid or expired code." };
  }

  // verifyEmail auto-establishes the session (cookies written server-side).
  redirect("/account");
}

export async function signOut() {
  const auth = await createInsForgeAuthActions();
  await auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  if (!email.includes("@")) return { error: "Enter a valid email" };

  const insforge = await createInsForgeAuthClient();
  const { error } = await insforge.auth.sendResetPasswordEmail({ email });
  if (error) return { error: error.message };

  redirect(
    `/account/reset-password?email=${encodeURIComponent(email)}&sent=1`
  );
}

export async function resetPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  const otp = String(formData.get("otp") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !otp) {
    return { error: "Enter your email and the 6-digit reset code." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const insforge = await createInsForgeAuthClient();
  const { error } = await insforge.auth.resetPassword({
    newPassword: password,
    otp,
  });
  if (error) return { error: error.message };

  redirect("/login?reset=1");
}

export async function updateProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const fullName = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (fullName.length < 2) return { error: "Please enter your full name" };

  const insforge = await createClient();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await insforge.database
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/account", "layout");
  return { success: "Profile updated" };
}
