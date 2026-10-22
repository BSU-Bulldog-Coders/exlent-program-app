import "server-only";
import { prisma } from "@/lib/prisma";

export type AttendanceSummary = { attended: number; eligible: number };

/**
 * Attended vs. eligible classes per student. A class is eligible once it has
 * been opened at or after the student joined; classes they attended always count.
 */
export async function getAttendanceSummaries(
  students: { id: string; createdAt: Date }[],
): Promise<Map<string, AttendanceSummary>> {
  if (students.length === 0) return new Map();

  const [openedClasses, attendedCounts] = await Promise.all([
    prisma.class.findMany({
      where: { status: { not: "DRAFT" }, openedAt: { not: null } },
      select: { openedAt: true },
    }),
    prisma.attendance.groupBy({
      by: ["userId"],
      where: { userId: { in: students.map((s) => s.id) } },
      _count: { _all: true },
    }),
  ]);

  const attendedById = new Map(attendedCounts.map((row) => [row.userId, row._count._all]));
  return new Map(
    students.map((student) => {
      const attended = attendedById.get(student.id) ?? 0;
      const sinceJoining = openedClasses.filter(
        (c) => c.openedAt && c.openedAt >= student.createdAt,
      ).length;
      return [student.id, { attended, eligible: Math.max(attended, sinceJoining) }];
    }),
  );
}
