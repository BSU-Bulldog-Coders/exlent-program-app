import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { ClassFormDialog } from "@/components/classes/class-form-dialog";
import { ClassStatusBadge } from "@/components/classes/class-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Classes" };

export default async function AdminClassesPage() {
  await requireAdmin();
  const classes = await prisma.class.findMany({
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { attendances: true } } },
  });

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

      {classes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No classes yet. Click <span className="font-medium">New</span> to create the first one.
        </div>
      ) : (
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
              {classes.map((item) => (
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
                  <TableCell className="text-right">{item._count.attendances}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
