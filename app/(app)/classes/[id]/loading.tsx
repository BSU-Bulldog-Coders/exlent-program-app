import { BackLinkSkeleton, InlineSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "@phosphor-icons/react/ssr";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <BackLinkSkeleton label="Classes" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl">
              <InlineSkeleton className="h-[0.75em] w-56" />
            </h1>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <p className="text-sm text-muted-foreground">
            <InlineSkeleton className="h-3.5 w-80" />
          </p>
        </div>
        <Button size="lg" className="w-40 shrink-0 justify-center px-3" disabled>
          <CheckCircleIcon data-icon="inline-start" />
          Check in
        </Button>
      </div>
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-2xl">Resources</h2><p className="text-sm text-muted-foreground">Materials shared for this class.</p></div>
        </div>
        <Skeleton className="h-28 w-full" />
      </section>
    </>
  );
}
