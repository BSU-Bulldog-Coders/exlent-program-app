import "server-only";
import { randomUUID } from "node:crypto";
import { sendQueuedAttendanceWarningEmail } from "@/lib/attendance-warning-email";
import { prisma } from "@/lib/attendance-warning-delivery-store";
import { appUrl } from "@/lib/env";
import { emailRetryDelayMs } from "@/lib/email-retry";

const LEASE_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const status = {
  pending: "PENDING",
  processing: "PROCESSING",
  sent: "SENT",
  failed: "FAILED",
} as const;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed";
}

/** Claims one due warning with a lease so two workers can never send it twice. */
async function claimWarning(id: string) {
  const now = new Date();
  const leaseId = randomUUID();
  const claimed = await prisma.attendanceWarning.updateMany({
    where: {
      id,
      clearedAt: null,
      OR: [
        { status: status.pending, nextAttemptAt: { lte: now } },
        { status: status.processing, lockedUntil: { lte: now } },
      ],
    },
    data: {
      status: status.processing,
      leaseId,
      lockedUntil: new Date(now.getTime() + LEASE_MS),
      attempts: { increment: 1 },
    },
  });
  if (claimed.count !== 1) return null;

  return prisma.attendanceWarning.findFirst({
    where: { id, leaseId },
    select: {
      id: true,
      recipientEmail: true,
      idempotencyKey: true,
      attempts: true,
      leaseId: true,
      user: { select: { name: true } },
      class: { select: { name: true } },
      previousClass: { select: { name: true } },
    },
  });
}

/** Delivers one warning. Failures are persisted for retry rather than thrown into the caller. */
export async function deliverAttendanceWarning(id: string) {
  const warning = await claimWarning(id);
  if (!warning?.leaseId) return { delivered: false as const };

  try {
    await sendQueuedAttendanceWarningEmail({
      to: warning.recipientEmail,
      name: warning.user.name,
      previousClassName: warning.previousClass.name,
      className: warning.class.name,
      url: `${appUrl()}/`,
      idempotencyKey: warning.idempotencyKey,
    });
    await prisma.attendanceWarning.updateMany({
      where: { id, status: status.processing, leaseId: warning.leaseId },
      data: { status: status.sent, sentAt: new Date(), lockedUntil: null, leaseId: null, lastError: null },
    });
    return { delivered: true as const };
  } catch (error) {
    const exhausted = warning.attempts >= MAX_ATTEMPTS;
    await prisma.attendanceWarning.updateMany({
      where: { id, status: status.processing, leaseId: warning.leaseId },
      data: exhausted
        ? { status: status.failed, lockedUntil: null, leaseId: null, lastError: errorMessage(error) }
        : {
            status: status.pending,
            nextAttemptAt: new Date(Date.now() + emailRetryDelayMs(warning.attempts)),
            lockedUntil: null,
            leaseId: null,
            lastError: errorMessage(error),
          },
    });
    console.error("[attendance-warning] delivery failed", error);
    return { delivered: false as const };
  }
}

/** Processes due warnings serially to keep provider use bounded in serverless invocations. */
export async function deliverDueAttendanceWarnings(limit = 50) {
  const now = new Date();
  const due = await prisma.attendanceWarning.findMany({
    where: {
      clearedAt: null,
      OR: [
        { status: status.pending, nextAttemptAt: { lte: now } },
        { status: status.processing, lockedUntil: { lte: now } },
      ],
    },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
    select: { id: true },
  });
  const results = [];
  for (const warning of due) results.push(await deliverAttendanceWarning(warning.id));
  return { claimed: due.length, delivered: results.filter((result) => result.delivered).length };
}
