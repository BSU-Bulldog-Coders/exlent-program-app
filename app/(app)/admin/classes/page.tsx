import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { ClassFormDialog } from "@/components/classes/class-form-dialog";
import { ADMIN_CLASS_COLUMNS } from "@/components/classes/class-list-columns";
import { ClassPagination, ClassPaginationSkeleton } from "@/components/classes/class-pagination";
import { ClassSearch, ClassSearchSkeleton } from "@/components/classes/class-search";
import { ClassStatusBadge } from "@/components/classes/class-status-badge";
import { TableSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";
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
import { requireAdmin } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Classes" };

export default function AdminClassesPage(props: PageProps<"/admin/classes">) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl">Classes</h1>
          <p className="text-sm text-muted-foreground">
            Create a class, show its QR code, and track who attends.
          </p>
        </div>
        <ClassFormDialog
          trigger={
            <Button>
              <PlusIcon data-icon="inline-start" />
              New
            </Button>
          }
        />
      </div>
      <Suspense fallback={<ClassSearchSkeleton />}>
        <ClassSearch />
      </Suspense>
      <Suspense
        fallback={
          <TableSkeleton columns={ADMIN_CLASS_COLUMNS} footer={<ClassPaginationSkeleton colSpan={4} />} />
        }
      >
        <ClassesContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function ClassesContent({ searchParams }: { searchParams: PageProps<"/admin/classes">["searchParams"] }) {
  const admin = await requireAdmin();
  const requested = parseClassListParams(await searchParams);
  const { items, total, page, pageCount } = await listClasses(admin, requested);

  if (total === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        {requested.q ? (
          <>No classes match &ldquo;{requested.q}&rdquo;.</>
        ) : (
          <>
            No classes yet. Click <span className="font-medium">New</span> to create the first one.
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Checked in</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <Link href={`/admin/classes/${item.id}`} className="hover:underline">
                  {item.name}
                </Link>
              </TableCell>
              <TableCell>{formatDateTime(item.startsAt, item.timezone)}</TableCell>
              <TableCell>
                <ClassStatusBadge status={item.status} />
              </TableCell>
              <TableCell className="text-right">{item.attendanceCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <ClassPagination
          basePath="/admin/classes"
          params={{ ...requested, page }}
          pageCount={pageCount}
          colSpan={4}
        />
      </Table>
    </div>
  );
}
