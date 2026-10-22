import { BackLinkSkeleton, InlineSkeleton } from "@/components/app/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <BackLinkSkeleton label="My classes" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl">
            <InlineSkeleton className="h-[0.75em] w-56" />
          </h1>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <p className="text-sm text-muted-foreground">
          <InlineSkeleton className="h-3.5 w-80" />
        </p>
      </div>
    </>
  );
}
