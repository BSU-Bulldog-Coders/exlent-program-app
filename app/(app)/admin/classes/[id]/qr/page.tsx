import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { AttendeeList } from "@/components/classes/attendee-list";
import { CloseClassButton } from "@/components/classes/close-class-button";
import { QrDisplay } from "@/components/classes/qr-display";
import { getClassAttendance } from "@/lib/classes";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Attendance QR" };

export default async function ClassQrPage(props: PageProps<"/admin/classes/[id]/qr">) {
  await requireAdmin();
  const { id } = await props.params;
  const item = await prisma.class.findUnique({ where: { id } });
  if (!item) notFound();
  if (item.status !== "OPEN") redirect(`/admin/classes/${id}`);
  const attendance = await getClassAttendance(id);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href={`/admin/classes/${id}/attendance`}
            className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" /> Take attendance
          </Link>
          <h1 className="text-4xl">{item.name}</h1>
        </div>
        <CloseClassButton classId={id} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,28rem)_1fr]">
        <QrDisplay classId={id} />
        <AttendeeList
          classId={id}
          timezone={item.timezone}
          initial={{ attendees: attendance.attendees, absent: [] }}
          showAbsent={false}
          live
          bare
        />
      </div>
    </>
  );
}
