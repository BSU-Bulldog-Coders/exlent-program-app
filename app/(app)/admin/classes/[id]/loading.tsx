import { ListChecksIcon, PencilSimpleIcon } from "@phosphor-icons/react/ssr";
import { BackLinkSkeleton, InlineSkeleton, TableSkeleton } from "@/components/app/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Loading() {
  return (
    <>
      <BackLinkSkeleton label="All classes" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl">
            <InlineSkeleton className="h-[0.75em] w-56" />
          </h1>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <p className="text-sm text-muted-foreground">
          <InlineSkeleton className="h-3.5 w-64" />
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled>
          <ListChecksIcon data-icon="inline-start" />
          Take attendance
        </Button>
        <Button variant="outline" disabled>
          <PencilSimpleIcon data-icon="inline-start" />
          Edit
        </Button>
      </div>
      <Tabs defaultValue="checked-in" className="gap-4">
        <TabsList>
          <TabsTrigger value="checked-in">
            Checked in
            <Badge variant="outline" className="h-5 min-w-5 px-1.5">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="not-checked-in">
            Not checked in
            <Badge variant="outline" className="h-5 min-w-5 px-1.5">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
            </Badge>
          </TabsTrigger>
        </TabsList>
        <TableSkeleton
          columns={[
            { label: "Name", width: "w-32" },
            { label: "Email", width: "w-48" },
            { label: "Checked in", width: "w-16", align: "right" },
          ]}
        />
      </Tabs>
    </>
  );
}
