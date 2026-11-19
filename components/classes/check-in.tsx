"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import { checkIn, type CheckInResult } from "@/app/attend/actions";
import { Button } from "@/components/ui/button";

/** Runs the check-in once on mount, so scanning is all a student has to do. */
export function CheckIn({ token }: { token: string }) {
  const [result, setResult] = useState<CheckInResult | null>(null);
  const started = useRef(false);

  const run = useCallback(async () => {
    setResult(null);
    try {
      setResult(await checkIn(token));
    } catch {
      setResult({ status: "invalid" });
    }
  }, [token]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
  }, [run]);

  if (!result) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <SpinnerIcon className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Checking you in…</p>
      </div>
    );
  }

  const success = result.status === "checked-in" || result.status === "already";
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {success ? (
        <CheckCircleIcon className="size-12 text-success" />
      ) : (
        <XCircleIcon className="size-12 text-destructive" />
      )}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl">
          {result.status === "checked-in" ? "You're checked in" : null}
          {result.status === "already" ? "Already checked in" : null}
          {!success ? "Couldn't check you in" : null}
        </h1>
        <p className="text-sm text-muted-foreground">
          {result.status === "checked-in" || result.status === "already"
            ? result.className
            : "Please scan the QR code on the screen and try again."}
        </p>
      </div>
      <Button variant="outline" render={<Link href="/classes" />}>
        View classes
      </Button>
    </div>
  );
}
