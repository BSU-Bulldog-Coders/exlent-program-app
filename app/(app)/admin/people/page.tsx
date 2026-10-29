import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PeopleTabs } from "@/components/people/people-tabs";
import { InviteRowActions } from "@/components/people/invite-row-actions";
import { ActiveUserActions, DeletedUserActions } from "@/components/people/user-deletion-actions";
import { PeopleHeader } from "@/components/people/people-header";
import { PeopleSkeleton } from "@/components/people/people-skeleton";
import { Badge } from "@/components/ui/badge";
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
import { formatDate, percent } from "@/lib/format";
import { inviteStatus } from "@/lib/invites";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "People" };

export default function PeoplePage() {
  return (
    <>
      <PeopleHeader />
      <Suspense fallback={<PeopleSkeleton />}>
        <PeopleContent />
      </Suspense>
    </>
  );
}

async function PeopleContent() {
  await requireAdmin();
  const [users, deletedUsers, openInvites] = await Promise.all([
    prisma.user.findMany({
      where: { deletionScheduledAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { deletionScheduledAt: { not: null } },
      orderBy: { deletionDueAt: "asc" },
      select: { id: true, name: true, email: true, role: true, deletionDueAt: true },
    }),
    prisma.invite.findMany({
      where: { acceptedAt: null, revokedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const students = users.filter((u) => u.role === "STUDENT");
  const admins = users.filter((u) => u.role === "ADMIN");
  const summaries = await getAttendanceSummaries(students);

  return (
      <PeopleTabs
        studentCount={students.length}
        adminCount={admins.length}
        deletedCount={deletedUsers.length}
        students={
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Attendance</TableHead>
                  <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const summary = summaries.get(student.id);
                  const rate = summary ? percent(summary.attended, summary.eligible) : null;
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/people/${student.id}`} className="hover:underline">
                          {student.name}
                        </Link>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <Badge variant={student.emailVerified ? "secondary" : "outline"}>
                          {student.emailVerified ? "Active" : "Unverified"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(student.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {rate === null ? "–" : `${rate}% (${summary?.attended}/${summary?.eligible})`}
                      </TableCell>
                      <TableCell className="text-right">
                        <ActiveUserActions userId={student.id} name={student.name} email={student.email} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                <InviteRows invites={openInvites.filter((i) => i.role === "STUDENT")} colSpan={6} />
                {students.length === 0 && openInvites.every((i) => i.role !== "STUDENT") ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No students yet. Invite the first one.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        }
        admins={
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/people/${admin.id}`} className="hover:underline">
                        {admin.name}
                      </Link>
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Active</Badge>
                    </TableCell>
                    <TableCell>{formatDate(admin.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <ActiveUserActions userId={admin.id} name={admin.name} email={admin.email} />
                    </TableCell>
                  </TableRow>
                ))}
                <InviteRows invites={openInvites.filter((i) => i.role === "ADMIN")} colSpan={5} />
              </TableBody>
            </Table>
          </div>
        }
        deleted={
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Deletes on</TableHead>
                  <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant="outline">{user.role === "ADMIN" ? "Admin" : "Student"}</Badge></TableCell>
                    <TableCell>{user.deletionDueAt ? formatDate(user.deletionDueAt) : "–"}</TableCell>
                    <TableCell className="text-right">
                      <DeletedUserActions userId={user.id} name={user.name} email={user.email} />
                    </TableCell>
                  </TableRow>
                ))}
                {deletedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No accounts are scheduled for deletion.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        }
      />
  );
}

function InviteRows({
  invites,
  colSpan,
}: {
  invites: { id: string; email: string; createdAt: Date; acceptedAt: Date | null; revokedAt: Date | null; expiresAt: Date }[];
  colSpan: number;
}) {
  return invites.map((invite) => {
    const expired = inviteStatus(invite) === "expired";
    return (
      <TableRow key={invite.id} className="text-muted-foreground">
        <TableCell>–</TableCell>
        <TableCell>{invite.email}</TableCell>
        <TableCell>
          <Badge variant="outline">{expired ? "Invite expired" : "Invited"}</Badge>
        </TableCell>
        <TableCell>{formatDate(invite.createdAt)}</TableCell>
        <TableCell className="text-right" colSpan={Math.max(1, colSpan - 4)}>
          <InviteRowActions inviteId={invite.id} email={invite.email} />
        </TableCell>
      </TableRow>
    );
  });
}
