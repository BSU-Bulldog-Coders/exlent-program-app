import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Class" };

export default async function StudentClassPage(props: PageProps<"/classes/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;
  if (user.role === "ADMIN") redirect(`/admin/classes/${id}`);

  const [item, attendance] = await Promise.all([
    prisma.class.findUnique({
      where: { id },
      select: { name: true, description: true, startsAt: true, timezone: true },
    }),
    prisma.attendance.findUnique({
      where: { classId_userId: { classId: id, userId: user.id } },
      select: { checkedInAt: true },
    }),
  ]);
  if (!item) notFound();

  return (
    <>
      <Link
        href="/classes"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> My classes
      </Link>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl">{item.name}</h1>
          {attendance ? <Badge>Attended</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDateTime(item.startsAt, item.timezone)}
          {attendance ? ` · checked in at ${formatDateTime(attendance.checkedInAt, item.timezone)}` : ""}
        </p>
        {item.description ? (
          <p className="max-w-prose whitespace-pre-wrap text-sm">{item.description}</p>
        ) : null}
      </div>
    </>
  );
}
