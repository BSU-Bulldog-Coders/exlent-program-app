"use client";

import { RouteError } from "@/components/app/route-error";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <RouteError error={error} retry={retry} backHref="/login" backLabel="Back to sign in" />
      </div>
    </main>
  );
}
