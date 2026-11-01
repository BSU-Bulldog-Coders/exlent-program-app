import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "My classes" };

export default async function StudentClassesPage() {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin/classes");

  // Students only ever see classes they attended.
  const attendances = await prisma.attendance.findMany({
    where: { userId: user.id },
    orderBy: { class: { startsAt: "desc" } },
    select: {
      checkedInAt: true,
      class: { select: { id: true, name: true, startsAt: true, timezone: true } },
    },
  });

  return (
    <>
      <div>
        <h1 className="text-4xl">My classes</h1>
        <p className="text-sm text-muted-foreground">
          Classes you&apos;ve attended. Scan the QR code in class to check in.
        </p>
      </div>
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          You haven&apos;t attended any classes yet.
          <p className="mt-2 text-xs">Scan the QR code shown by your admin during class to check in automatically.</p>
        </div>      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Checked in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendances.map(({ class: item, checkedInAt }) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <Link href={`/classes/${item.id}`} className="hover:underline">
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDateTime(item.startsAt, item.timezone)}</TableCell>
                  <TableCell>{formatDateTime(checkedInAt, item.timezone)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
