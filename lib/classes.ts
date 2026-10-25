import "server-only";
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
      where: { classId },
      orderBy: { checkedInAt: "desc" },
      select: {
        checkedInAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
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
