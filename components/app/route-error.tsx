"use client";

import Link from "next/link";
import { useEffect } from "react";
import { WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/** Shared body for every route's error.tsx. Server error details are hidden in production, so only the digest is shown. */
export function RouteError({
  error,
  retry,
  backHref,
  backLabel,
}: {
  error: unknown;
  retry: () => void;
  backHref?: string;
  backLabel?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest =
    error instanceof Error && "digest" in error ? String((error as { digest?: unknown }).digest) : null;

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WarningIcon />
        </EmptyMedia>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>
          We couldn&apos;t load this page. Try again, and if it keeps happening, let an admin know.
          {digest ? ` (Reference: ${digest})` : null}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => retry()}>Try again</Button>
          {backHref && backLabel ? (
            <Button variant="outline" render={<Link href={backHref} />}>
              {backLabel}
            </Button>
          ) : null}
        </div>
      </EmptyContent>
    </Empty>
  );
}
