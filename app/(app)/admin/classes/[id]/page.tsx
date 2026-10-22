import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AttendeeList } from "@/components/classes/attendee-list";
import { ClassActions } from "@/components/classes/class-actions";
import { ClassStatusBadge } from "@/components/classes/class-status-badge";
import { getClassAttendance } from "@/lib/classes";
import { requireAdmin } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Class" };

export default async function AdminClassPage(props: PageProps<"/admin/classes/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const item = await prisma.class.findUnique({ where: { id } });
  if (!item) notFound();
  const attendance = await getClassAttendance(id);

  return (
    <>
      <Link
        href="/admin/classes"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All classes
      </Link>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl">{item.name}</h1>
          <ClassStatusBadge status={item.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDateTime(item.startsAt, item.timezone)} ({item.timezone})
        </p>
        {item.description ? (
          <p className="max-w-prose whitespace-pre-wrap text-sm">{item.description}</p>
        ) : null}
      </div>
      <ClassActions
        data={{
          id: item.id,
          name: item.name,
          description: item.description,
          startsAt: item.startsAt.toISOString(),
          status: item.status,
        }}
      />
      <AttendeeList
        classId={item.id}
        timezone={item.timezone}
        initial={attendance}
        showAbsent={item.status !== "DRAFT"}
        live={item.status === "OPEN"}
      />
    </>
  );
}
