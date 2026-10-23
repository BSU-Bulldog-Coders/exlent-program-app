import {
  BackLinkSkeleton,
  InlineSkeleton,
  StatCardSkeleton,
  TableSkeleton,
} from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function PersonSkeleton() {
  return (
    <>
      <BackLinkSkeleton label="People" />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl">
            <InlineSkeleton className="h-[0.75em] w-48" />
          </h1>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <p className="text-sm text-muted-foreground">
          <InlineSkeleton className="h-3.5 w-72" />
        </p>
      </div>
      <div>
        <Button size="sm" variant="outline" disabled>
          Reset password
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCardSkeleton label="Classes attended" />
        <StatCardSkeleton label="Attendance rate" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl">Attended classes</h2>
        <TableSkeleton
          columns={[
            { label: "Class", width: "w-48" },
            { label: "Date", width: "w-40" },
            { label: "Checked in", width: "w-40" },
          ]}
        />
      </div>
    </>
  );
}
