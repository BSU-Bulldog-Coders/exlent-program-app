"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  type ForgotPasswordState,
} from "@/app/(auth)/forgot-password/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.submitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          If an account exists for that address, we&apos;ve sent a password reset link. Check your
          inbox and spam folder.
        </p>
        <Link href="/login" className="text-sm underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
      </FieldGroup>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <Link href="/login" className="text-center text-sm underline underline-offset-4">
        Back to sign in
      </Link>
    </form>
  );
}
