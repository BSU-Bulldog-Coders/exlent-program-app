"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (newPassword !== confirmation) {
      setError("New passwords do not match.");
      setSaved(false);
      return;
    }
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const { error: authError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (authError) {
        setError(authError.message ?? "Could not change your password.");
        return;
      }
      formElement.reset();
      setSaved(true);
    });
  }

  return (
    <form onSubmit={submit} className="flex max-w-sm flex-col gap-4">
      <div>
        <h2 className="text-xl">Password</h2>
        <p className="text-sm text-muted-foreground">Changing it signs out your other devices.</p>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="current-password">Current password</FieldLabel>
          <Input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            maxLength={128}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-new-password">New password</FieldLabel>
          <Input
            id="profile-new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-password-confirmation">Confirm new password</FieldLabel>
          <Input
            id="profile-password-confirmation"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </Field>
      </FieldGroup>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {saved ? <p className="text-sm text-muted-foreground">Password changed.</p> : null}
      <Button type="submit" className="w-fit" disabled={pending}>
        {pending ? "Changing…" : "Change password"}
      </Button>
    </form>
  );
}
