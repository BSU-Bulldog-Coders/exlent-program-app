"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/(app)/profile/actions";
import { UserAvatar } from "@/components/app/user-avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ProfileForm({
  user,
}: {
  user: { id: string; name: string; email: string; image: string | null };
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});

  return (
    <form action={action} className="flex max-w-sm flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel>Avatar</FieldLabel>
          <UserAvatar user={user} size="lg" />
          <FieldDescription>
            Leave the URL blank to remove your photo and use a generated DiceBear adventurer
            avatar instead.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-email">Email</FieldLabel>
          <Input id="profile-email" value={user.email} readOnly disabled />
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-name">Name</FieldLabel>
          <Input id="profile-name" name="name" defaultValue={user.name} required maxLength={100} />
        </Field>
        <Field>
          <FieldLabel htmlFor="profile-image-url">Profile image URL</FieldLabel>
          <Input
            id="profile-image-url"
            name="image"
            defaultValue={user.image ?? ""}
            placeholder="https://…"
            maxLength={500}
            inputMode="url"
          />
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
