"use server";

import { revalidatePath } from "next/cache";
import { verifyAttendanceToken } from "@/lib/attendance-token";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export type CheckInResult =
  | { status: "checked-in" | "already"; className: string }
  | {
      status: "expired" | "invalid" | "closed" | "not-student" | "unauthorized";
    };

/**
 * Records attendance for the signed-in student when the scanned token is
 * authentic, unexpired, and the class is open. Safe to call repeatedly.
 */
export async function checkIn(token: string): Promise<CheckInResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "unauthorized" };
  if (user.role !== "STUDENT") return { status: "not-student" };

  const verified = verifyAttendanceToken(token);
  if (!verified.ok) return { status: verified.reason };

  return recordAttendance(user.id, verified.classId);
}

/** Self check-in from the class page. Always records the signed-in student. */
export async function checkInToClass(classId: string): Promise<CheckInResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "unauthorized" };
  if (user.role !== "STUDENT") return { status: "not-student" };

  return recordAttendance(user.id, classId);
}

async function recordAttendance(
  userId: string,
  classId: string,
): Promise<CheckInResult> {
  const item = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, name: true, status: true },
  });
  if (!item) return { status: "invalid" };
  if (item.status !== "OPEN") return { status: "closed" };

  // The unique (classId, userId) constraint makes this idempotent and race-safe.
  const { count } = await prisma.attendance.createMany({
    data: { classId: item.id, userId },
    skipDuplicates: true,
  });
  revalidatePath(`/classes/${item.id}`);
  return { status: count > 0 ? "checked-in" : "already", className: item.name };
}
