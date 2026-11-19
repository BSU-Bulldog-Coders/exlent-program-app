"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { checkInToClass } from "@/app/attend/actions";
import { Button } from "@/components/ui/button";

/** Lets a student mark themselves present on an open class. */
export function SelfCheckInButton({ classId }: { classId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      try {
        const result = await checkInToClass(classId);
        if (result.status === "checked-in" || result.status === "already") {
          toast.success(
            result.status === "checked-in"
              ? "You're checked in"
              : "Already checked in",
          );
        } else {
          toast.error("Couldn't check you in. Try again.");
        }
      } catch {
        toast.error("Couldn't check you in. Try again.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button
      size="lg"
      className="w-40 shrink-0 justify-center px-3"
      disabled={pending}
      onClick={run}
    >
      <CheckCircleIcon data-icon="inline-start" />
      {pending ? "Checking in…" : "Check in"}
    </Button>
  );
}
