import { BackLinkSkeleton, InlineSkeleton } from "@/components/app/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LockIcon } from "@phosphor-icons/react/ssr";

export default function Loading() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <BackLinkSkeleton label="Take attendance" />
          <h1 className="text-4xl">
            <InlineSkeleton className="h-[0.75em] w-56" />
          </h1>
        </div>
        <Button variant="outline" disabled>
          <LockIcon data-icon="inline-start" />
          Close class
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,28rem)_1fr]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex aspect-square w-full max-w-md items-center justify-center rounded-xl border border-border bg-white p-6">
            <Skeleton className="size-full rounded-lg" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            The code refreshes every 30 seconds. Students scan it with their phone camera.
          </p>
        </div>
        <section className="flex w-full min-w-0 flex-col gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl">Checked in</h2>
            <Badge variant="secondary">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
            </Badge>
          </div>
          <ul className="divide-y">
            {Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">
                    <InlineSkeleton className="h-3.5 w-32" />
                  </p>
                  <p className="text-muted-foreground">
                    <InlineSkeleton className="h-3.5 w-44" />
                  </p>
                </div>
                <Skeleton className="h-3.5 w-14" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
