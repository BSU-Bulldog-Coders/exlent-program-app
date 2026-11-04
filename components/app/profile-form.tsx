"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ProfileForm({
  user,
}: {
  user: { name: string; email: string };
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});

  return (
    <form action={action} className="flex max-w-sm flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="profile-email">Email</FieldLabel>
          <Input id="profile-email" value={user.email} readOnly disabled />
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-name">Name</FieldLabel>
          <Input id="profile-name" name="name" defaultValue={user.name} required maxLength={100} />
        </Field>
      </FieldGroup>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.saved ? <p className="text-sm text-muted-foreground">Saved.</p> : null}
      <Button type="submit" className="w-fit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
