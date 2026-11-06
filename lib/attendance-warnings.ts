import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma, scheduleUserDeletionInTx } from "@/lib/attendance-warning-store";

type Transaction = Prisma.TransactionClient;
type Actor = { id: string };

// One program-wide key, so missed-class checks run strictly one at a time. An
// advisory transaction lock is released automatically on commit or rollback.
const EVALUATION_LOCK_KEY = 7_301_004;
const TRANSACTION_TIMEOUT_MS = 15_000;
const SWEEP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
// The sweep leaves a freshly closed class alone so it never races its own check.
const SWEEP_MIN_AGE_MS = 5 * 60 * 1000;

// A FAILED warning never reached the student, so it does not count as a warning.
const ACTIVE_STATUSES = ["PENDING", "PROCESSING", "SENT"] as const;
type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

export type ActiveWarning = { status: ActiveStatus; classStartsAt: Date };
export type PlanCandidate = { userId: string; activeWarning: ActiveWarning | null };
export type WarningPlan = { warn: string[]; escalate: string[]; hold: string[] };

/**
 * Decides what to do for students who missed both the just-closed class and the
 * class before it (`previousStartsAt`).
 *
 * - no active warning: warn them (this is their second miss in a row)
 * - active warning that was delivered, and its class is the previous class or
 *   earlier: this is the third miss in a row, so schedule deletion
 * - active warning not delivered yet: wait until the email has actually gone out
 */
export function planActions(candidates: PlanCandidate[], previousStartsAt: Date): WarningPlan {
  const plan: WarningPlan = { warn: [], escalate: [], hold: [] };
  for (const { userId, activeWarning } of candidates) {
    if (!activeWarning) plan.warn.push(userId);
    else if (activeWarning.status === "SENT" && previousStartsAt >= activeWarning.classStartsAt) {
      plan.escalate.push(userId);
    } else plan.hold.push(userId);
  }
  return plan;
}

export type SkipReason =
  | "not-closed"
  | "already-checked"
  | "no-attendance"
  | "not-latest"
  | "no-previous-class";

export type ClosureCheck = {
  skipped: SkipReason | null;
  warned: number;
  scheduledForDeletion: number;
};

function skipped(reason: SkipReason): ClosureCheck {
  return { skipped: reason, warned: 0, scheduledForDeletion: 0 };
}

type ClosedClass = { id: string; startsAt: Date };

async function evaluate(tx: Transaction, closed: ClosedClass, actor: Actor): Promise<ClosureCheck> {
  // A class nobody was marked present for was not really held (a test class or a
  // cancelled one), so closing it must not warn everyone.
  if ((await tx.attendance.count({ where: { classId: closed.id } })) === 0) {
    return skipped("no-attendance");
  }

  const held = { status: "CLOSED" as const, attendances: { some: {} } };

  // Only the newest held class is checked. A class closed out of order would
  // otherwise produce a warning that predates a newer one.
  const newer = await tx.class.findFirst({
    where: { ...held, startsAt: { gt: closed.startsAt } },
    select: { id: true },
  });
  if (newer) return skipped("not-latest");

  const previous = await tx.class.findFirst({
    where: { ...held, startsAt: { lt: closed.startsAt } },
    orderBy: { startsAt: "desc" },
    select: { id: true, startsAt: true, openedAt: true },
  });
  if (!previous) return skipped("no-previous-class");

  // Students who could have attended both classes and attended neither.
  const students = await tx.user.findMany({
    where: {
      role: "STUDENT",
      emailVerified: true,
      deletionScheduledAt: null,
      createdAt: { lte: previous.openedAt ?? previous.startsAt },
      attendances: { none: { classId: { in: [closed.id, previous.id] } } },
    },
    select: { id: true, email: true },
  });
  if (students.length === 0) return { skipped: null, warned: 0, scheduledForDeletion: 0 };

  const warnings = await tx.attendanceWarning.findMany({
    where: {
      userId: { in: students.map((student) => student.id) },
      clearedAt: null,
      status: { in: [...ACTIVE_STATUSES] },
    },
    select: { userId: true, status: true, class: { select: { startsAt: true } } },
  });

  // Each student's most recent active warning.
  const latest = new Map<string, ActiveWarning>();
  for (const warning of warnings) {
    const current = latest.get(warning.userId);
    if (!current || warning.class.startsAt > current.classStartsAt) {
      latest.set(warning.userId, {
        status: warning.status as ActiveStatus,
        classStartsAt: warning.class.startsAt,
      });
    }
  }

  // Attending any class after the warning's class clears it.
  if (latest.size > 0) {
    const earliest = [...latest.values()].reduce(
      (min, warning) => (warning.classStartsAt < min ? warning.classStartsAt : min),
      new Date(8.64e15),
    );
    const laterAttendance = await tx.attendance.findMany({
      where: { userId: { in: [...latest.keys()] }, class: { startsAt: { gt: earliest } } },
      select: { userId: true, class: { select: { startsAt: true } } },
    });
    for (const attendance of laterAttendance) {
      const warning = latest.get(attendance.userId);
      if (warning && attendance.class.startsAt > warning.classStartsAt) latest.delete(attendance.userId);
    }
  }

  const plan = planActions(
    students.map((student) => ({ userId: student.id, activeWarning: latest.get(student.id) ?? null })),
    previous.startsAt,
  );

  let warned = 0;
  if (plan.warn.length > 0) {
    const emailById = new Map(students.map((student) => [student.id, student.email]));
    // The unique (userId, classId) key makes a repeat run a no-op.
    const created = await tx.attendanceWarning.createMany({
      data: plan.warn.map((userId) => ({
        userId,
        classId: closed.id,
        previousClassId: previous.id,
        recipientEmail: emailById.get(userId) as string,
        idempotencyKey: `attendance-warning:${userId}:${closed.id}`,
      })),
      skipDuplicates: true,
    });
    warned = created.count;
  }

  let scheduledForDeletion = 0;
  for (const userId of plan.escalate) {
    if ((await scheduleUserDeletionInTx(tx, actor, userId)) === "scheduled") scheduledForDeletion += 1;
  }

  return { skipped: null, warned, scheduledForDeletion };
}

/**
 * Runs the missed-classes check for a class that was just closed. Everything,
 * including marking the class as checked, happens in one transaction behind a
 * program-wide advisory lock: concurrent closes, the cron sweep and a
 * close/reopen/close cycle cannot double-warn or skip a due escalation, and a
 * crash leaves nothing half-done.
 */
export async function evaluateClassClosure(classId: string, actor: Actor): Promise<ClosureCheck> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${EVALUATION_LOCK_KEY}::bigint)`;

      // Re-read after taking the lock: another evaluator may have finished, or
      // the class may have been reopened, while this one waited.
      const closed = await tx.class.findUnique({
        where: { id: classId },
        select: { id: true, status: true, startsAt: true, attendanceCheckedAt: true },
      });
      if (!closed || closed.status !== "CLOSED") return skipped("not-closed");
      if (closed.attendanceCheckedAt) return skipped("already-checked");

      const outcome = await evaluate(tx, closed, actor);
      await tx.class.update({ where: { id: classId }, data: { attendanceCheckedAt: new Date() } });
      return outcome;
    },
    { timeout: TRANSACTION_TIMEOUT_MS, maxWait: TRANSACTION_TIMEOUT_MS },
  );
}

/** Daily safety net: re-runs the check for recently closed classes whose check never finished. */
export async function evaluatePendingClassClosures(limit = 20) {
  const now = Date.now();
  const classes = await prisma.class.findMany({
    where: {
      status: "CLOSED",
      attendanceCheckedAt: null,
      closedAt: { gte: new Date(now - SWEEP_WINDOW_MS), lte: new Date(now - SWEEP_MIN_AGE_MS) },
    },
    orderBy: { startsAt: "asc" },
    take: limit,
    select: { id: true, createdById: true },
  });

  let warned = 0;
  let scheduledForDeletion = 0;
  let failed = 0;
  for (const item of classes) {
    try {
      const result = await evaluateClassClosure(item.id, { id: item.createdById });
      warned += result.warned;
      scheduledForDeletion += result.scheduledForDeletion;
    } catch (error) {
      failed += 1;
      console.error("[attendance-warnings] sweep failed for class", item.id, error);
    }
  }
  return { considered: classes.length, warned, scheduledForDeletion, failed };
}
