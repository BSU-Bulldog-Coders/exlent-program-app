"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function LoginForm({ callbackURL }: { callbackURL: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setError(null);
    setUnverifiedEmail(null);

    startTransition(async () => {
      const { error } = await authClient.signIn.email({ email, password, callbackURL });
      if (error) {
        if (error.status === 403) {
          setUnverifiedEmail(email);
          setError("Please verify your email address before signing in.");
        } else {
          setError(error.message ?? "Could not sign in.");
        }
        return;
      }
      router.push(callbackURL);
      router.refresh();
    });
  }

  async function resend() {
    if (!unverifiedEmail) return;
    const { error } = await authClient.sendVerificationEmail({
      email: unverifiedEmail,
      callbackURL,
    });
    if (error) toast.error(error.message ?? "Could not resend the email.");
    else toast.success("Verification email sent.");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
      </FieldGroup>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}{" "}
          {unverifiedEmail ? (
            <button type="button" onClick={resend} className="underline underline-offset-4">
              Resend email
            </button>
          ) : null}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href={`/sign-up?callbackURL=${encodeURIComponent(callbackURL)}`}
          className="underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
