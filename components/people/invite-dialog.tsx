"use client";

import { useState, useTransition } from "react";
import { UserPlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { inviteUser } from "@/app/(app)/admin/people/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function InviteDialog({ role }: { role: "STUDENT" | "ADMIN" }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const noun = role === "ADMIN" ? "admin" : "student";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setError(null);
    startTransition(async () => {
      const result = await inviteUser({ email, role });
      if (!result.ok) return setError(result.error);
      toast.success(`Invitation sent to ${email}.`);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <UserPlusIcon data-icon="inline-start" />
            Invite {noun}
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Invite {noun}</DialogTitle>
            <DialogDescription>
              We&apos;ll email them a link, valid for 7 days, to choose a password and join the
              program.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="invite-email">Email address</FieldLabel>
            <Input id="invite-email" name="email" type="email" required autoFocus />
          </Field>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
