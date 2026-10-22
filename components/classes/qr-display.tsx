"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type State =
  | { kind: "loading" }
  | { kind: "ready"; url: string }
  | { kind: "closed" }
  | { kind: "error"; message: string };

/** Fetches a fresh signed token on an interval and renders it as a QR code. */
export function QrDisplay({ classId }: { classId: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function refresh() {
      let nextDelay = 5000;
      try {
        const response = await fetch(`/api/classes/${classId}/qr`, { cache: "no-store" });
        if (cancelled) return;
        if (response.status === 409) {
          setState({ kind: "closed" });
          return;
        }
        if (!response.ok) {
          setState({ kind: "error", message: "Couldn't load the QR code. Retrying…" });
        } else {
          const body: { url: string; rotateMs: number } = await response.json();
          setState({ kind: "ready", url: body.url });
          nextDelay = body.rotateMs;
        }
      } catch {
        if (!cancelled) setState({ kind: "error", message: "Connection lost. Retrying…" });
      }
      if (!cancelled) timer = setTimeout(refresh, nextDelay);
    }

    refresh();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [classId]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex aspect-square w-full max-w-md items-center justify-center rounded-xl border border-border bg-white p-6">
        {state.kind === "ready" ? (
          <QRCodeSVG
            value={state.url}
            level="M"
            marginSize={0}
            className="h-full w-full"
            title="Attendance QR code"
          />
        ) : (
          <p className="text-center text-sm text-neutral-600">
            {state.kind === "loading" ? "Loading…" : null}
            {state.kind === "closed" ? "This class is closed." : null}
            {state.kind === "error" ? state.message : null}
          </p>
        )}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        The code refreshes every 30 seconds. Students scan it with their phone camera.
      </p>
    </div>
  );
}
