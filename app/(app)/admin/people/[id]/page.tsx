import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAttendanceSummaries } from "@/lib/attendance-stats";
import { requireAdmin } from "@/lib/dal";
import { formatDate, formatDateTime, percent } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Person" };

export default async function PersonPage(props: PageProps<"/admin/people/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const person = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      joinedVia: true,
      createdAt: true,
    },
  });
  if (!person) notFound();

  const isStudent = person.role === "STUDENT";
  const [attendances, summary] = await Promise.all([
    isStudent
      ? prisma.attendance.findMany({
          where: { userId: id },
          orderBy: { class: { startsAt: "desc" } },
          select: {
            checkedInAt: true,
            class: { select: { id: true, name: true, startsAt: true, timezone: true } },
          },
        })
      : [],
    isStudent
      ? getAttendanceSummaries([person]).then((map) => map.get(person.id))
      : undefined,
  ]);

  return (
    <>
      <Link
        href="/admin/people"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> People
      </Link>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl">{person.name}</h1>
          <Badge variant="secondary">{isStudent ? "Student" : "Admin"}</Badge>
          {!person.emailVerified ? <Badge variant="outline">Unverified</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {person.email} · joined {formatDate(person.createdAt)} via{" "}
          {person.joinedVia.toLowerCase()}
        </p>
      </div>

      {isStudent && summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardDescription>Classes attended</CardDescription>
                <CardTitle className="text-3xl">{summary.attended}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Attendance rate</CardDescription>
                <CardTitle className="text-3xl">
                  {summary.eligible > 0 ? `${percent(summary.attended, summary.eligible)}%` : "–"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl">Attended classes</h2>
            {attendances.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes attended yet.</p>
            ) : (
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
                          <Link href={`/admin/classes/${item.id}`} className="hover:underline">
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
          </div>
        </>
      ) : null}
    </>
  );
}
