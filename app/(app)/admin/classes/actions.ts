"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { deliverDueAttendanceWarnings } from "@/lib/attendance-warning-delivery";
import { evaluateClassClosure } from "@/lib/attendance-warnings";
import { requireAdmin } from "@/lib/dal";
import { isValidTimeZone } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const classSchema = z.object({
  name: z.string().trim().min(1, "Enter a class name.").max(120),
  description: z.string().trim().max(2000).optional(),
  startsAt: z.iso.datetime({ offset: true, message: "Enter a valid date and time." }),
  timezone: z.string().refine(isValidTimeZone, "Unknown timezone."),
});

export async function createClass(
  input: z.input<typeof classSchema>,
): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = classSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { name, description, startsAt, timezone } = parsed.data;

  const created = await prisma.class.create({
    data: {
      name,
      description: description || null,
      startsAt: new Date(startsAt),
      timezone,
      // New classes accept check-ins right away; an admin closes them when done.
      status: "OPEN",
      openedAt: new Date(),
      createdById: admin.id,
    },
  });
  revalidatePath("/admin/classes");
  return { ok: true, id: created.id };
}

export async function updateClass(
  id: string,
  input: z.input<typeof classSchema>,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = classSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { name, description, startsAt, timezone } = parsed.data;

  const result = await prisma.class.updateMany({
    where: { id },
    data: { name, description: description || null, startsAt: new Date(startsAt), timezone },
  });
  if (result.count === 0) return { ok: false, error: "Class not found." };
  revalidatePath("/admin/classes");
  revalidatePath(`/admin/classes/${id}`);
  return { ok: true };
}

/** DRAFT/CLOSED -> OPEN. Idempotent for an already open class. */
export async function openClass(id: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await prisma.class.updateMany({
    where: { id, status: { not: "OPEN" } },
    // Reopening clears the check marker so the next close re-checks attendance.
    data: { status: "OPEN", openedAt: new Date(), closedAt: null, attendanceCheckedAt: null },
  });
  if (result.count === 0 && !(await prisma.class.findUnique({ where: { id }, select: { id: true } }))) {
    return { ok: false, error: "Class not found." };
  }
  revalidatePath("/admin/classes");
  revalidatePath(`/admin/classes/${id}`);
  return { ok: true };
}

export type CloseClassResult = {
  /** Students who were sent a missed-two-classes warning. */
  warned: number;
  /** Students whose account was scheduled for deletion (third miss in a row). */
  scheduledForDeletion: number;
  /** Another admin closed it first; nothing was done here. */
  alreadyClosed?: boolean;
};

export async function closeClass(id: string): Promise<ActionResult<CloseClassResult>> {
  const admin = await requireAdmin();
  // Atomic: when two admins close at once exactly one update matches, so only
  // that admin runs the attendance check.
  const result = await prisma.class.updateMany({
    where: { id, status: "OPEN" },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  if (result.count === 0) {
    const current = await prisma.class.findUnique({ where: { id }, select: { status: true } });
    if (current?.status === "CLOSED") {
      revalidatePath(`/admin/classes/${id}`);
      return { ok: true, warned: 0, scheduledForDeletion: 0, alreadyClosed: true };
    }
    return { ok: false, error: current ? "This class isn't open." : "Class not found." };
  }

  let warned = 0;
  let scheduledForDeletion = 0;
  try {
    ({ warned, scheduledForDeletion } = await evaluateClassClosure(id, admin));
  } catch (error) {
    // The class is closed either way; the daily sweep re-runs the check.
    console.error("[attendance-warnings] check failed, the daily sweep will retry", error);
  }
  if (warned > 0) {
    after(async () => {
      await deliverDueAttendanceWarnings();
    });
  }

  revalidatePath("/admin/classes");
  revalidatePath(`/admin/classes/${id}`);
  revalidatePath("/admin/people");
  return { ok: true, warned, scheduledForDeletion };
}

/**
 * Manually marks a student present or absent for a class. Absent means no
 * attendance record, so it removes the student's check-in. Admins can do this
 * whatever the class status is.
 */
export async function setAttendance(
  classId: string,
  userId: string,
  present: boolean,
): Promise<ActionResult> {
  await requireAdmin();

  const [item, student] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId }, select: { id: true } }),
    prisma.user.findFirst({ where: { id: userId, role: "STUDENT", deletionScheduledAt: null }, select: { id: true } }),
  ]);
  if (!item) return { ok: false, error: "Class not found." };
  if (!student) return { ok: false, error: "Student not found." };

  if (present) {
    await prisma.attendance.createMany({ data: { classId, userId }, skipDuplicates: true });
  } else {
    await prisma.attendance.deleteMany({ where: { classId, userId } });
  }

  revalidatePath(`/admin/classes/${classId}`);
  revalidatePath("/admin/classes");
  revalidatePath(`/admin/people/${userId}`);
  return { ok: true };
}
