"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { resetPassword, type ActionState } from "@/app/actions/auth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, formAction] = useActionState<ActionState, FormData>(
    resetPassword,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Set a new password</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your new password. The reset link is valid for 1 hour.
        </p>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <SubmitButton className="w-full">Update Password</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container max-w-md py-12">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
