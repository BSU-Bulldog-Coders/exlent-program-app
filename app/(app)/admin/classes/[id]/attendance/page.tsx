import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { AttendanceRoster } from "@/components/classes/attendance-roster";
import { ScanQrButton } from "@/components/classes/scan-qr-button";
import { requireAdmin } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Take attendance" };

export default async function TakeAttendancePage(
  props: PageProps<"/admin/classes/[id]/attendance">,
) {
  await requireAdmin();
  const { id } = await props.params;
  const item = await prisma.class.findUnique({ where: { id } });
  if (!item) notFound();

  const [students, attendances] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, image: true },
    }),
    prisma.attendance.findMany({ where: { classId: id }, select: { userId: true } }),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href={`/admin/classes/${id}`}
            className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" /> Class details
          </Link>
          <h1 className="text-4xl">{item.name}</h1>
          <p className="text-sm text-muted-foreground">
            Take attendance · {formatDateTime(item.startsAt, item.timezone)}
          </p>
        </div>
        <ScanQrButton classId={id} />
      </div>
      <AttendanceRoster
        classId={id}
        students={students}
        initialPresentIds={attendances.map((a) => a.userId)}
        live={item.status === "OPEN"}
      />
    </>
  );
}
