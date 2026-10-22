"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function ResendVerificationButton({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending || !email}
      onClick={() =>
        startTransition(async () => {
          const { error } = await authClient.sendVerificationEmail({ email, callbackURL: "/" });
          if (error) toast.error(error.message ?? "Could not resend the email.");
          else toast.success("Verification email sent.");
        })
      }
    >
      {pending ? "Sending…" : "Resend email"}
    </Button>
  );
}
