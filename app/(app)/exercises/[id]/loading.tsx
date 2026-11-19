import { BackLinkSkeleton, InlineSkeleton } from "@/components/app/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@phosphor-icons/react/ssr";

export function DetailSkeleton() {
  return <section aria-label="Exercise workspace" className="-m-4 h-[calc(100dvh-3rem)] min-h-64 md:-m-6"><div className="grid h-full grid-rows-[45%_55%] overflow-hidden md:grid-cols-[45%_55%] md:grid-rows-1"><div className="space-y-5 overflow-hidden border-b p-4 md:border-r md:border-b-0 md:p-6"><BackLinkSkeleton label="Exercises" /><h1 className="text-4xl"><InlineSkeleton className="h-[0.8em] w-56" /></h1><div className="space-y-2"><h2 className="text-lg font-medium">Description</h2><Skeleton className="h-20 w-full" /></div><div className="space-y-3"><h2 className="text-lg font-medium">Testcases</h2><div className="space-y-2 rounded-md border p-3 text-sm"><h3 className="font-medium">Testcase 1</h3><div><span className="text-muted-foreground">Input</span><Skeleton className="h-4 w-32" /></div><div><span className="text-muted-foreground">Expected output</span><Skeleton className="h-4 w-32" /></div></div></div></div><div className="space-y-4 overflow-hidden p-4 md:p-6"><div className="flex items-center justify-between gap-3"><h2 className="text-2xl">Practice</h2><Button size="sm" disabled><PlayIcon />Run code</Button></div><Skeleton className="h-64 w-full rounded-md" /><div className="space-y-3"><h3 className="text-lg font-medium">Run history</h3><Skeleton className="h-14 w-full" /></div></div></div></section>;
}
export default function Loading() { return <DetailSkeleton />; }
