"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import { checkIn, type CheckInResult } from "@/app/attend/actions";
import { Button } from "@/components/ui/button";

const MESSAGES: Record<Exclude<CheckInResult["status"], "checked-in" | "already">, string> = {
  expired: "This QR code has expired. Scan the code on the screen again.",
  invalid: "This QR code isn't valid. Scan the code on the screen again.",
  closed: "This class is no longer taking attendance.",
  "not-student": "Only students check in to classes.",
  unauthorized: "Please sign in to check in.",
};

/** Calls the check-in action once on mount, so scanning is all a student has to do. */
export function CheckIn({ token }: { token: string }) {
  const [result, setResult] = useState<CheckInResult | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    checkIn(token)
      .then(setResult)
      .catch(() => setResult({ status: "invalid" }));
  }, [token]);

  if (!result) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Checking you in…</p>
      </div>
    );
  }

  const success = result.status === "checked-in" || result.status === "already";
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {success ? (
        <CircleCheck className="size-12 text-success" />
      ) : (
        <CircleX className="size-12 text-destructive" />
      )}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl">
          {result.status === "checked-in" ? "You're checked in" : null}
          {result.status === "already" ? "Already checked in" : null}
          {!success ? "Couldn't check you in" : null}
        </h1>
        <p className="text-sm text-muted-foreground">
          {success ? result.className : MESSAGES[result.status as keyof typeof MESSAGES]}
        </p>
      </div>
      <Button variant="outline" render={<Link href="/classes" />}>
        View my classes
      </Button>
    </div>
  );
}
