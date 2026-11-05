import { Skeleton } from "@/components/ui/skeleton";

export function LeaderboardRowsSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <ol className="divide-y">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-8" />
        </li>
      ))}
    </ol>
  );
}
