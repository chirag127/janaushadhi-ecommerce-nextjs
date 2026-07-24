"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { verifyEmail, type ActionState } from "@/app/actions/auth";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, formAction] = useActionState<ActionState, FormData>(
    verifyEmail,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Verify your email</CardTitle>
        <p className="text-sm text-muted-foreground">
          Click below to verify your email and activate your account.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" /> {state.error}
            </div>
          )}
          {state?.success && (
            <div className="flex items-center gap-2 rounded-md bg-primary/10 p-3 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" /> {state.success}
            </div>
          )}
          <input type="hidden" name="token" value={token} />
          <SubmitButton className="w-full">Verify Email</SubmitButton>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Wrong account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Sign up again
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
