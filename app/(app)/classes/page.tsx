import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/app/skeletons";
import { STUDENT_CLASS_COLUMNS } from "@/components/classes/class-list-columns";
import { ClassPagination, ClassPaginationSkeleton } from "@/components/classes/class-pagination";
import { ClassSearch, ClassSearchSkeleton } from "@/components/classes/class-search";
import { ClassStatusBadge } from "@/components/classes/class-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseClassListParams } from "@/lib/class-list-params";
import { listClasses } from "@/lib/classes";
import { requireUser } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Classes" };

export default function StudentClassesPage(props: PageProps<"/classes">) {
  return (
    <>
      <div>
        <h1 className="text-4xl">Classes</h1>
        <p className="text-sm text-muted-foreground">
          Open a class to check in while it&apos;s open, or scan the QR code in class.
        </p>
      </div>
      <Suspense fallback={<ClassSearchSkeleton />}>
        <ClassSearch />
      </Suspense>
      <Suspense
        fallback={
          <TableSkeleton columns={STUDENT_CLASS_COLUMNS} footer={<ClassPaginationSkeleton colSpan={4} />} />
        }
      >
        <ClassesContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function ClassesContent({ searchParams }: { searchParams: PageProps<"/classes">["searchParams"] }) {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin/classes");
  const requested = parseClassListParams(await searchParams);
  const { items, total, page, pageCount } = await listClasses(user, requested);

  if (total === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        {requested.q ? <>No classes match &ldquo;{requested.q}&rdquo;.</> : "No classes yet."}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Checked in</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <Link href={`/classes/${item.id}`} className="hover:underline">
                  {item.name}
                </Link>
              </TableCell>
              <TableCell>{formatDateTime(item.startsAt, item.timezone)}</TableCell>
              <TableCell>
                <ClassStatusBadge status={item.status} />
              </TableCell>
              <TableCell>
                {item.checkedInAt ? formatDateTime(item.checkedInAt, item.timezone) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <ClassPagination basePath="/classes" params={{ ...requested, page }} pageCount={pageCount} colSpan={4} />
      </Table>
    </div>
  );
}
