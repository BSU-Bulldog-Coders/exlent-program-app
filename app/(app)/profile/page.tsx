import type { Metadata } from "next";
import { ProfileForm } from "@/components/app/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAttendanceSummaries } from "@/lib/attendance-stats";
import { requireUser } from "@/lib/dal";
import { formatDate, percent } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Profile" };

/** Always the signed-in user's own profile; there is no way to open someone else's. */
export default async function ProfilePage() {
  const current = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: current.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  const summary =
    user.role === "STUDENT"
      ? (await getAttendanceSummaries([user])).get(user.id)
      : undefined;

  return (
    <>
      <div>
        <h1 className="text-4xl">Profile</h1>
        <p className="text-sm text-muted-foreground">
          {user.role === "ADMIN" ? "Admin" : "Student"} · joined {formatDate(user.createdAt)}
        </p>
      </div>
      {summary ? (
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
                {percent(summary.attended, summary.eligible) ?? "–"}
                {summary.eligible > 0 ? "%" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {summary.attended} of {summary.eligible} classes since you joined
            </CardContent>
          </Card>
        </div>
      ) : null}
      <ProfileForm name={user.name} email={user.email} />
    </>
  );
}
