"use client";

import { useTransition } from "react";
import { Ban, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { resendInvite, revokeInvite } from "@/app/(app)/admin/people/actions";
import { Button } from "@/components/ui/button";

export function InviteRowActions({ inviteId, email }: { inviteId: string; email: string }) {
  const [pending, startTransition] = useTransition();

  function run(action: typeof resendInvite, success: string) {
    startTransition(async () => {
      const result = await action(inviteId);
      if (result.ok) toast.success(success);
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(resendInvite, `Invitation resent to ${email}.`)}
      >
        <RotateCw data-icon="inline-start" />
        Resend
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => run(revokeInvite, "Invitation revoked.")}
      >
        <Ban data-icon="inline-start" />
        Revoke
      </Button>
    </div>
  );
}
