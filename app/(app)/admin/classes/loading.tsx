import { PlusIcon } from "@phosphor-icons/react/ssr";
import { TableSkeleton } from "@/components/app/skeletons";
import { ADMIN_CLASS_COLUMNS } from "@/components/classes/class-list-columns";
import { ClassPaginationSkeleton } from "@/components/classes/class-pagination";
import { ClassSearchSkeleton } from "@/components/classes/class-search";
import { Button } from "@/components/ui/button";

export default function Loading() {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl">Classes</h1>
          <p className="text-sm text-muted-foreground">
            Create a class, show its QR code, and track who attends.
          </p>
        </div>
        <Button disabled>
          <PlusIcon data-icon="inline-start" />
          New
        </Button>
      </div>
      <ClassSearchSkeleton />
      <TableSkeleton columns={ADMIN_CLASS_COLUMNS} footer={<ClassPaginationSkeleton colSpan={4} />} />
    </>
  );
}
