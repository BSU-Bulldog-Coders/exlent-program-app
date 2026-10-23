"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(
    token ? null : "This password reset link is invalid or incomplete.",
  );

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (newPassword !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const { error: authError } = await authClient.resetPassword({ token, newPassword });
      if (authError) {
        setError("This password reset link is invalid or expired. Request a new one to continue.");
        return;
      }
      router.replace("/login?passwordReset=1");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="new-password">New password</FieldLabel>
          <Input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            disabled={!token}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmation">Confirm new password</FieldLabel>
          <Input
            id="confirmation"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            disabled={!token}
            required
          />
        </Field>
      </FieldGroup>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || !token}>
        {pending ? "Resetting…" : "Reset password"}
      </Button>
      <Link href="/forgot-password" className="text-center text-sm underline underline-offset-4">
        Request a new link
      </Link>
    </form>
  );
}
