import { PlusIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ResourceListSkeleton() {
  return <>
    <div className="flex items-center justify-between gap-4">
      <div><h1 className="text-4xl">Resources</h1><p className="text-sm text-muted-foreground">Files, recordings, and links shared with the program.</p></div>
      <Button disabled><PlusIcon data-icon="inline-start" />New</Button>
    </div>
    <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-44 w-full" />)}</div>
  </>;
}
