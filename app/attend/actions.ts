"use server";

import { revalidatePath } from "next/cache";
import { verifyAttendanceToken } from "@/lib/attendance-token";
import { getCurrentUser } from "@/lib/dal";
import { evaluateLocation } from "@/lib/geofence";
import { prisma } from "@/lib/prisma";

export type CheckInResult =
  | { status: "checked-in" | "already"; className: string }
  | { status: "expired" | "invalid" | "closed" | "not-student" | "unauthorized" | "no-location" }
  | { status: "inaccurate"; accuracyMeters: number }
  | { status: "out-of-range"; distanceMeters: number };

type Evidence = { distanceMeters: number; accuracyMeters: number };

/** Turns a failed location verdict into a result, or returns the evidence to store. */
function checkLocation(location: unknown): { result: CheckInResult } | { evidence: Evidence } {
  const verdict = evaluateLocation(location);
  if (verdict.ok) return { evidence: { distanceMeters: verdict.distanceMeters, accuracyMeters: verdict.accuracyMeters } };
  if (verdict.reason === "no-location") return { result: { status: "no-location" } };
  if (verdict.reason === "inaccurate") return { result: { status: "inaccurate", accuracyMeters: verdict.accuracyMeters } };
  return { result: { status: "out-of-range", distanceMeters: verdict.distanceMeters } };
}

/**
 * Records attendance for the signed-in student when the scanned token is
 * authentic, unexpired, the class is open, and the student is within range of the
 * check-in location (a QR code can be photographed and forwarded, so the token
 * alone doesn't prove presence). Safe to call repeatedly.
 */
export async function checkIn(token: string, location: unknown): Promise<CheckInResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "unauthorized" };
  if (user.role !== "STUDENT") return { status: "not-student" };

  const verified = verifyAttendanceToken(token);
  if (!verified.ok) return { status: verified.reason };

  const checked = checkLocation(location);
  if ("result" in checked) return checked.result;
  return recordAttendance(user.id, verified.classId, checked.evidence);
}

/**
 * Self check-in from the class page, no QR needed. Same rules as the QR flow:
 * signed-in student, class open, in range, idempotent. Always records the session
 * user. The distance is computed here; the client never says whether it is in range.
 */
export async function checkInToClass(classId: string, location: unknown): Promise<CheckInResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "unauthorized" };
  if (user.role !== "STUDENT") return { status: "not-student" };

  const checked = checkLocation(location);
  if ("result" in checked) return checked.result;
  return recordAttendance(user.id, classId, checked.evidence);
}

async function recordAttendance(userId: string, classId: string, evidence: Evidence): Promise<CheckInResult> {
  const item = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, name: true, status: true },
  });
  if (!item) return { status: "invalid" };
  if (item.status !== "OPEN") return { status: "closed" };

  // The unique (classId, userId) constraint makes this idempotent and race-safe.
  const { count } = await prisma.attendance.createMany({
    data: { classId: item.id, userId, ...evidence },
    skipDuplicates: true,
  });
  revalidatePath(`/classes/${item.id}`);
  return { status: count > 0 ? "checked-in" : "already", className: item.name };
}
