import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const ACCOUNT_DELETION_DELAY_MS = 30 * 24 * 60 * 60 * 1000;

type Actor = { id: string };
type LockedUser = {
  id: string;
  role: "ADMIN" | "STUDENT";
  deletionScheduledAt: Date | null;
  deletionDueAt: Date | null;
};
type Transaction = Prisma.TransactionClient;

export type ScheduleDeletionResult =
  | "scheduled"
  | "already-scheduled"
  | "not-found"
  | "cannot-delete-self"
  | "last-admin";
export type UndoDeletionResult = "undone" | "not-found" | "not-scheduled";
export type DeleteNowResult = "deleted" | "not-found" | "not-scheduled";

export function accountDeletionDueAt(now = new Date()) {
  return new Date(now.getTime() + ACCOUNT_DELETION_DELAY_MS);
}

async function lockUser(tx: Transaction, userId: string): Promise<LockedUser | null> {
  await tx.$queryRaw`SELECT "id" FROM "user" WHERE "id" = ${userId} FOR UPDATE`;
  return tx.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, deletionScheduledAt: true, deletionDueAt: true },
  });
}

async function activeAdminCountWithLock(tx: Transaction) {
  await tx.$queryRaw`SELECT "id" FROM "user" WHERE "role" = 'ADMIN' AND "deletionScheduledAt" IS NULL ORDER BY "id" FOR UPDATE`;
  return tx.user.count({ where: { role: "ADMIN", deletionScheduledAt: null } });
}

/** Schedule deletion and revoke every active session atomically. */
export function scheduleUserDeletion(actor: Actor, userId: string): Promise<ScheduleDeletionResult> {
  return prisma.$transaction((tx) => scheduleUserDeletionInTx(tx, actor, userId));
}

/**
 * The body of scheduleUserDeletion for callers that already hold a transaction
 * (the missed-classes check schedules deletions inside its own locked one).
 */
export async function scheduleUserDeletionInTx(
  tx: Transaction,
  actor: Actor,
  userId: string,
): Promise<ScheduleDeletionResult> {
  // Read the role first, then lock every active admin in a stable order. This
  // prevents two admin-deletion requests from deadlocking on different
  // target rows while each verifies the final-active-admin safeguard.
  const candidate = await tx.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!candidate) return "not-found";
  const activeAdmins = candidate.role === "ADMIN" ? await activeAdminCountWithLock(tx) : null;
  const target = await lockUser(tx, userId);
  if (!target) return "not-found";
  if (target.id === actor.id) return "cannot-delete-self";
  if (target.deletionScheduledAt) return "already-scheduled";

  if (target.role === "ADMIN" && activeAdmins !== null && activeAdmins <= 1) {
    return "last-admin";
  }

  // Transfer restrictive ownership now, ensuring that cron can delete this
  // account even if the administrator who scheduled it later leaves.
  await Promise.all([
    tx.class.updateMany({ where: { createdById: target.id }, data: { createdById: actor.id } }),
    tx.announcement.updateMany({ where: { authorId: target.id }, data: { authorId: actor.id } }),
    tx.exercise.updateMany({ where: { creatorId: target.id }, data: { creatorId: actor.id } }),
    tx.session.deleteMany({ where: { userId: target.id } }),
  ]);

  const now = new Date();
  await tx.user.update({
    where: { id: target.id },
    data: { deletionScheduledAt: now, deletionDueAt: accountDeletionDueAt(now) },
  });
  return "scheduled";
}

export async function undoUserDeletion(userId: string): Promise<UndoDeletionResult> {
  return prisma.$transaction(async (tx) => {
    const target = await lockUser(tx, userId);
    if (!target) return "not-found";
    if (!target.deletionScheduledAt) return "not-scheduled";
    await tx.user.update({
      where: { id: target.id },
      data: { deletionScheduledAt: null, deletionDueAt: null },
    });
    // Reinstating an account also wipes its missed-classes warnings, so the
    // student starts again from a clean count.
    await tx.attendanceWarning.updateMany({
      where: { userId: target.id, clearedAt: null },
      data: { clearedAt: new Date() },
    });
    return "undone";
  });
}

async function deleteScheduledUser(userId: string, dueOnly: boolean): Promise<DeleteNowResult> {
  return prisma.$transaction(async (tx) => {
    // Both cron and Delete now call this locked transaction. Whichever locks
    // first deletes the row; the other safely observes it as absent.
    const target = await lockUser(tx, userId);
    if (!target) return "not-found";
    if (!target.deletionScheduledAt) return "not-scheduled";
    if (dueOnly && (!target.deletionDueAt || target.deletionDueAt > new Date())) return "not-scheduled";

    // Scheduling already reassigned Class and Announcement foreign keys. User
    // deletion cascades Better Auth's account/session data and attendance.
    // deleteMany also gives a safe not-found result if an external cleanup won
    // the race after the lock was acquired.
    const removed = await tx.user.deleteMany({ where: { id: target.id } });
    return removed.count === 1 ? "deleted" : "not-found";
  });
}

/** Permanently delete an already-scheduled account immediately. */
export function deleteUserNow(userId: string) {
  return deleteScheduledUser(userId, false);
}

/** Process a bounded, due-only deletion batch for the daily cron route. */
export async function purgeDueUserDeletions(limit = 50) {
  const due = await prisma.user.findMany({
    where: { deletionDueAt: { lte: new Date() } },
    orderBy: { deletionDueAt: "asc" },
    take: limit,
    select: { id: true },
  });
  let deleted = 0;
  for (const user of due) {
    if ((await deleteScheduledUser(user.id, true)) === "deleted") deleted += 1;
  }
  return { considered: due.length, deleted };
}
