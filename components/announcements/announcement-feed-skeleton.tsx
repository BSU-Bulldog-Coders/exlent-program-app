import { Skeleton } from "@/components/ui/skeleton";

export function AnnouncementFeedSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-xl bg-card p-4 ring-1 ring-border">
          <Skeleton className="h-6 w-2/5" />
          <div className="mt-1 flex items-center gap-2">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-2 h-4 w-2/5" />
        </div>
      ))}
    </div>
  );
}
