"use client";

import { KeyIcon } from "@phosphor-icons/react";
import { useTransition } from "react";
import { toast } from "sonner";
import { sendPasswordReset } from "@/app/(app)/admin/people/actions";
import { Button } from "@/components/ui/button";

export function PasswordResetButton({ userId, email }: { userId: string; email: string }) {
  const [pending, startTransition] = useTransition();

  function requestReset() {
    startTransition(async () => {
      const result = await sendPasswordReset(userId);
      if (!result.ok) {
        toast.error(result.error);
      } else if (result.active) {
        toast.message(`A reset link for ${email} is already active.`);
      } else {
        toast.success(`Password reset link sent to ${email}.`);
      }
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={requestReset}>
      <KeyIcon data-icon="inline-start" />
      {pending ? "Sending…" : "Reset password"}
    </Button>
  );
}
