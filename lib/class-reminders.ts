import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { appUrl } from "@/lib/env";
import { emailRetryDelayMs } from "@/lib/email-retry";
import { sendQueuedClassReminderEmail } from "@/lib/class-reminder-email";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const LEASE_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed";
}

/**
 * Queues one reminder per student for a class. Students only: admins are never
 * emailed. Unverified accounts and students already scheduled for deletion are
 * skipped. The unique (classId, userId) key makes a repeat call a no-op.
 * Runs inside the caller's transaction so the class and its reminders commit together.
 */
export async function queueClassReminders(tx: Prisma.TransactionClient, classId: string) {
  const students = await tx.user.findMany({
    where: { role: "STUDENT", emailVerified: true, deletionScheduledAt: null },
    select: { id: true, email: true },
  });
  if (students.length === 0) return 0;
  const created = await tx.classReminder.createMany({
    data: students.map((student) => ({
      classId,
      userId: student.id,
      recipientEmail: student.email,
      idempotencyKey: `class-reminder:${student.id}:${classId}`,
    })),
    skipDuplicates: true,
  });
  return created.count;
}

/** Claims one due reminder with a lease so two workers can never send it twice. */
async function claimReminder(id: string) {
  const now = new Date();
  const leaseId = randomUUID();
  const claimed = await prisma.classReminder.updateMany({
    where: {
      id,
      OR: [
        { status: "PENDING", nextAttemptAt: { lte: now } },
        { status: "PROCESSING", lockedUntil: { lte: now } },
      ],
    },
    data: {
      status: "PROCESSING",
      leaseId,
      lockedUntil: new Date(now.getTime() + LEASE_MS),
      attempts: { increment: 1 },
    },
  });
  if (claimed.count !== 1) return null;

  return prisma.classReminder.findFirst({
    where: { id, leaseId },
    select: {
      id: true,
      recipientEmail: true,
      idempotencyKey: true,
      attempts: true,
      leaseId: true,
      user: { select: { name: true } },
      class: { select: { id: true, name: true, status: true, startsAt: true, timezone: true } },
    },
  });
}

/** Delivers one reminder. Failures are persisted for retry rather than thrown into the caller. */
export async function deliverClassReminder(id: string) {
  const reminder = await claimReminder(id);
  if (!reminder?.leaseId) return { delivered: false as const };

  try {
    // Don't tell students to check in to a class that has already been closed.
    if (reminder.class.status === "CLOSED") {
      await prisma.classReminder.updateMany({
        where: { id, status: "PROCESSING", leaseId: reminder.leaseId },
        data: { status: "FAILED", lockedUntil: null, leaseId: null, lastError: "Class closed before delivery." },
      });
      return { delivered: false as const };
    }
    await sendQueuedClassReminderEmail({
      to: reminder.recipientEmail,
      name: reminder.user.name,
      className: reminder.class.name,
      startsAt: formatDateTime(reminder.class.startsAt, reminder.class.timezone),
      url: `${appUrl()}/classes/${reminder.class.id}`,
      idempotencyKey: reminder.idempotencyKey,
    });
    await prisma.classReminder.updateMany({
      where: { id, status: "PROCESSING", leaseId: reminder.leaseId },
      data: { status: "SENT", sentAt: new Date(), lockedUntil: null, leaseId: null, lastError: null },
    });
    return { delivered: true as const };
  } catch (error) {
    const exhausted = reminder.attempts >= MAX_ATTEMPTS;
    await prisma.classReminder.updateMany({
      where: { id, status: "PROCESSING", leaseId: reminder.leaseId },
      data: exhausted
        ? { status: "FAILED", lockedUntil: null, leaseId: null, lastError: errorMessage(error) }
        : {
            status: "PENDING",
            nextAttemptAt: new Date(Date.now() + emailRetryDelayMs(reminder.attempts)),
            lockedUntil: null,
            leaseId: null,
            lastError: errorMessage(error),
          },
    });
    console.error("[class-reminder] delivery failed", error);
    return { delivered: false as const };
  }
}

/**
 * Delivers every due reminder in one pass, deliberately with no batch limit.
 *
 * A reminder is only useful before the class starts. With a cap, students past
 * the cap would wait for the next cron run (daily, see vercel.json) and could be
 * reminded after the class. The cohort is small (dozens of students), so sending
 * them all serially in one run fits comfortably inside a function's time limit.
 * If the cohort ever grows to the point where one run can't finish (hundreds of
 * students), reintroduce a limit together with a more frequent cron, or loop in
 * the background until the queue is empty. Rows left unsent are safe: they stay
 * PENDING and the next run picks them up.
 */
export async function deliverDueClassReminders() {
  const now = new Date();
  const due = await prisma.classReminder.findMany({
    where: {
      OR: [
        { status: "PENDING", nextAttemptAt: { lte: now } },
        { status: "PROCESSING", lockedUntil: { lte: now } },
      ],
    },
    orderBy: { nextAttemptAt: "asc" },
    select: { id: true },
  });
  // Serial on purpose: keeps provider use steady and avoids rate-limit bursts.
  const results = [];
  for (const reminder of due) results.push(await deliverClassReminder(reminder.id));
  return { claimed: due.length, delivered: results.filter((result) => result.delivered).length };
}
