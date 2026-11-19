import { BackLinkSkeleton, InlineSkeleton } from "@/components/app/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export function SubmissionsSkeleton() {
  return <><BackLinkSkeleton label="Exercise" /><div><h1 className="text-4xl">Submissions</h1><p className="text-sm text-muted-foreground">Latest submissions for <InlineSkeleton className="h-3.5 w-28" />. Points are each student&apos;s current leaderboard total.</p></div><div className="rounded-lg border"><div className="flex justify-end gap-6 px-4 py-2 text-xs text-muted-foreground"><span>Submitted (UTC)</span><span>Points</span></div><ol className="divide-y">{Array.from({ length: 5 }, (_, i) => <li key={i} className="flex items-center gap-3 px-4 py-3"><Skeleton className="h-4 w-6" /><Skeleton className="size-6 rounded-full" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-8" /></li>)}</ol></div></>;
}
export default function Loading() { return <SubmissionsSkeleton />; }
