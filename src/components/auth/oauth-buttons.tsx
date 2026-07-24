"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const PROVIDERS = [
  { key: "google", label: "Google" },
  { key: "github", label: "GitHub" },
] as const;

export function OAuthButtons() {
  const params = useSearchParams();
  const next = params.get("redirect") ?? "/account";
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState("");

  async function signInWith(provider: string) {
    setError("");
    setPending(provider);
    try {
      const callbackURL =
        (typeof window !== "undefined" ? window.location.origin : "") + next;
      await authClient.signIn.social({ provider, callbackURL });
    } catch (e) {
      setError(e instanceof Error ? e.message : "OAuth failed");
      setPending("");
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        {PROVIDERS.map((p) => (
          <button
            key={p.key}
            type="button"
            disabled={!!pending}
            onClick={() => signInWith(p.key)}
            className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            {pending === p.key ? "…" : p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or use email
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
