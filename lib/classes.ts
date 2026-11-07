import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { ClassListParams } from "@/lib/class-list-params";
import { prisma } from "@/lib/prisma";

export type AttendancePerson = {
  userId: string;
  name: string;
  email: string;
  image: string | null;
};

export type ClassAttendance = {
  attendees: (AttendancePerson & { checkedInAt: string })[];
  absent: AttendancePerson[];
};

/** Who has checked in to a class, and which students have not (admin use only). */
export async function getClassAttendance(classId: string): Promise<ClassAttendance> {
  const [attendances, students] = await Promise.all([
    prisma.attendance.findMany({
      where: { classId, user: { deletionScheduledAt: null } },
      orderBy: { checkedInAt: "desc" },
      select: {
        checkedInAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT", deletionScheduledAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, image: true },
    }),
  ]);

  const presentIds = new Set(attendances.map((a) => a.user.id));
  return {
    attendees: attendances.map((a) => ({
      userId: a.user.id,
      name: a.user.name,
      email: a.user.email,
      image: a.user.image,
      checkedInAt: a.checkedInAt.toISOString(),
    })),
    absent: students
      .filter((s) => !presentIds.has(s.id))
      .map((s) => ({
        userId: s.id,
        name: s.name,
        email: s.email,
        image: s.image,
      })),
  };
}

export type ClassListViewer = { id: string; role: "ADMIN" | "STUDENT" };

export type ClassListItem = {
  id: string;
  name: string;
  startsAt: Date;
  timezone: string;
  status: "DRAFT" | "OPEN" | "CLOSED";
  /** Admins only: how many students checked in. */
  attendanceCount?: number;
  /** Students only: when this student checked in, or null. */
  checkedInAt?: Date | null;
};

export type ClassListPage = {
  items: ClassListItem[];
  total: number;
  /** Effective page: the requested one, clamped to the last page. */
  page: number;
  pageSize: number;
  pageCount: number;
};

/**
 * One page of classes, newest first. The filters are ANDed: students only get
 * non-draft classes, and `q` narrows by a case-insensitive name match.
 */
export async function listClasses(
  viewer: ClassListViewer,
  { page, pageSize, q }: ClassListParams,
): Promise<ClassListPage> {
  const where: Prisma.ClassWhereInput = {
    AND: [
      viewer.role === "ADMIN" ? {} : { status: { not: "DRAFT" } },
      q ? { name: { contains: q, mode: "insensitive" } } : {},
    ],
  };

  const total = await prisma.class.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const effectivePage = Math.min(page, pageCount);

  const rows = await prisma.class.findMany({
    where,
    // id breaks ties so rows never repeat or vanish across pages.
    orderBy: [{ startsAt: "desc" }, { id: "desc" }],
    skip: (effectivePage - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      name: true,
      startsAt: true,
      timezone: true,
      status: true,
      _count: { select: { attendances: true } },
      attendances: { where: { userId: viewer.id }, select: { checkedInAt: true } },
    },
  });

  const items = rows.map(({ _count, attendances, ...row }): ClassListItem =>
    viewer.role === "ADMIN"
      ? { ...row, attendanceCount: _count.attendances }
      : { ...row, checkedInAt: attendances[0]?.checkedInAt ?? null },
  );
  return { items, total, page: effectivePage, pageSize, pageCount };
}
