import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { ClassStatusBadge } from "@/components/classes/class-status-badge";
import { SelfCheckInButton } from "@/components/classes/self-check-in-button";
import { ClassContentTabs } from "@/components/classes/class-content-tabs";
import { ExerciseTable } from "@/components/exercises/exercise-table";
import { listExercises } from "@/lib/exercise-list";
import { ClassResources } from "@/components/resources/class-resources";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Class" };

export default async function StudentClassPage(props: PageProps<"/classes/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;
  if (user.role === "ADMIN") redirect(`/admin/classes/${id}`);

  const [item, attendance, resources, exercises] = await Promise.all([
    prisma.class.findUnique({
      where: { id },
      select: { name: true, description: true, startsAt: true, timezone: true, status: true },
    }),
    prisma.attendance.findUnique({
      where: { classId_userId: { classId: id, userId: user.id } },
      select: { checkedInAt: true },
    }),
    prisma.resource.findMany({ where: { classId: id, uploadStatus: "READY" }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, description: true, kind: true, originalName: true, youtubeUrl: true } }),
    listExercises(user, id),
  ]);
  // Drafts are admin-only, same as the classes list.
  if (!item || item.status === "DRAFT") notFound();

  return (
    <>
      <Link
        href="/classes"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Classes
      </Link>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl">{item.name}</h1>
            <ClassStatusBadge status={item.status} />
            {attendance ? <Badge>Attended</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(item.startsAt, item.timezone)} ({item.timezone})
            {attendance ? ` · checked in at ${formatDateTime(attendance.checkedInAt, item.timezone)}` : ""}
          </p>
          {item.description ? (
            <p className="max-w-prose whitespace-pre-wrap text-sm">{item.description}</p>
          ) : null}
        </div>
        {item.status === "OPEN" && !attendance ? <SelfCheckInButton classId={id} /> : null}
      </div>
      <ClassContentTabs resources={<ClassResources classId={id} classes={[]} resources={resources} canManage={false} />} exercises={<ExerciseTable exercises={exercises} isAdmin={false} returnTo={`/classes/${id}`} />} />
    </>
  );
}
