import { TableSkeleton } from "@/components/app/skeletons";
import { STUDENT_CLASS_COLUMNS } from "@/components/classes/class-list-columns";
import { ClassPaginationSkeleton } from "@/components/classes/class-pagination";
import { ClassSearchSkeleton } from "@/components/classes/class-search";

export default function Loading() {
  return (
    <>
      <div>
        <h1 className="text-4xl">Classes</h1>
        <p className="text-sm text-muted-foreground">
          Open a class to check in while it&apos;s open, or scan the QR code in class.
        </p>
      </div>
      <ClassSearchSkeleton />
      <TableSkeleton columns={STUDENT_CLASS_COLUMNS} footer={<ClassPaginationSkeleton colSpan={4} />} />
    </>
  );
}
