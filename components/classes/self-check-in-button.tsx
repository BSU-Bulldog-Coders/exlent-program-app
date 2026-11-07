"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { checkInToClass } from "@/app/attend/actions";
import { describeFailure, getPosition, LocationError, type LocationProblem } from "@/components/classes/location";
import { LocationProblemDialog } from "@/components/classes/location-problem-dialog";
import { Button } from "@/components/ui/button";

/** Lets a student mark themselves present on an open class, once their location is confirmed in range. */
export function SelfCheckInButton({ classId }: { classId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [problem, setProblem] = useState<LocationProblem | null>(null);

  function run() {
    startTransition(async () => {
      try {
        const position = await getPosition();
        setProblem(null);
        const result = await checkInToClass(classId, position);
        if (result.status === "checked-in" || result.status === "already") {
          toast.success(result.status === "checked-in" ? "You're checked in" : "Already checked in");
        } else {
          toast.error(describeFailure(result));
        }
      } catch (error) {
        if (error instanceof LocationError) setProblem(error.problem);
        else toast.error("Couldn't check you in. Try again.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <Button size="lg" className="w-40 shrink-0 justify-center px-3" disabled={pending} onClick={run}>
        <CheckCircleIcon data-icon="inline-start" />
        {pending ? "Checking in…" : "Check in"}
      </Button>
      <LocationProblemDialog problem={problem} pending={pending} onRetry={run} onClose={() => setProblem(null)} />
    </>
  );
}
