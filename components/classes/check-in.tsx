"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircleIcon, XCircleIcon, SpinnerIcon } from "@phosphor-icons/react";
import { checkIn, type CheckInResult } from "@/app/attend/actions";
import { describeFailure, getPosition, LocationError, PROBLEM_COPY, type LocationProblem } from "@/components/classes/location";
import { LocationProblemDialog } from "@/components/classes/location-problem-dialog";
import { Button } from "@/components/ui/button";

/** Runs the check-in once on mount, so scanning is all a student has to do. It asks for location first, because a QR code alone can be forwarded. */
export function CheckIn({ token }: { token: string }) {
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [problem, setProblem] = useState<LocationProblem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(true);
  const started = useRef(false);

  const run = useCallback(async () => {
    setBusy(true);
    setResult(null);
    try {
      const position = await getPosition();
      setProblem(null);
      setDialogOpen(false);
      setResult(await checkIn(token, position));
    } catch (error) {
      if (error instanceof LocationError) {
        setProblem(error.problem);
        setDialogOpen(true);
      } else {
        setResult({ status: "invalid" });
      }
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
  }, [run]);

  if (!result && problem) {
    return (
      <>
        <div className="flex flex-col items-center gap-4 text-center">
          <XCircleIcon className="size-12 text-destructive" />
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl">Couldn&apos;t check you in</h1>
            <p className="text-sm text-muted-foreground">{PROBLEM_COPY[problem].title}.</p>
          </div>
          <Button disabled={busy} onClick={() => void run()}>
            Try again
          </Button>
        </div>
        <LocationProblemDialog
          problem={dialogOpen ? problem : null}
          pending={busy}
          onRetry={() => void run()}
          onClose={() => setDialogOpen(false)}
        />
      </>
    );
  }

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
          {result.status === "checked-in" || result.status === "already" ? result.className : describeFailure(result)}
        </p>
      </div>
      {!success && (result.status === "out-of-range" || result.status === "inaccurate" || result.status === "no-location") ? (
        <Button disabled={busy} onClick={() => void run()}>
          Try again
        </Button>
      ) : null}
      <Button variant="outline" render={<Link href="/classes" />}>
        View classes
      </Button>
    </div>
  );
}
