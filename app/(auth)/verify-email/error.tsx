"use client";

import { RouteError } from "@/components/app/route-error";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <RouteError error={error} retry={retry} backHref="/login" backLabel="Back to sign in" />;
}
