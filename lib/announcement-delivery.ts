import "server-only";
import { randomUUID } from "node:crypto";
import { sendQueuedAnnouncementEmail } from "@/lib/announcement-email";
import { appUrl } from "@/lib/env";
import { emailRetryDelayMs } from "@/lib/password-reset";
import { prisma } from "@/lib/announcement-store";

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

type AnnouncementPayload = { title: string; body: string; className: string | null };

function isAnnouncementPayload(payload: unknown): payload is AnnouncementPayload {
  if (!payload || typeof payload !== "object") return false;
  const value = payload as Record<string, unknown>;
  return (
    typeof value.title === "string" &&
    typeof value.body === "string" &&
    (typeof value.className === "string" || value.className === null)
  );
}

async function claimAnnouncementDelivery(id: string) {
  const now = new Date();
  const leaseId = randomUUID();
  const lockedUntil = new Date(now.getTime() + LEASE_MS);
  const claimed = await prisma.announcementDelivery.updateMany({
    where: {
      id,
      OR: [
        { status: status.pending, nextAttemptAt: { lte: now } },
        { status: status.processing, lockedUntil: { lte: now } },
      ],
    },
    data: {
      status: status.processing,
      leaseId,
      lockedUntil,
      attempts: { increment: 1 },
    },
  });
  if (claimed.count !== 1) return null;

  return prisma.announcementDelivery.findFirst({
    where: { id, leaseId },
    select: {
      id: true,
      recipientEmail: true,
      idempotencyKey: true,
      attempts: true,
      leaseId: true,
      payload: true,
    },
  });
}

/** Delivers one snapshot recipient. Failures are persisted rather than thrown into UI actions. */
export async function deliverAnnouncementDelivery(id: string) {
  const delivery = await claimAnnouncementDelivery(id);
  if (!delivery?.leaseId) return { delivered: false as const };

  try {
    if (!isAnnouncementPayload(delivery.payload)) throw new Error("Invalid announcement email payload.");
    await sendQueuedAnnouncementEmail({
      to: delivery.recipientEmail,
      title: delivery.payload.title,
      body: delivery.payload.body,
      className: delivery.payload.className,
      url: `${appUrl()}/`,
      idempotencyKey: delivery.idempotencyKey,
    });
    await prisma.announcementDelivery.updateMany({
      where: { id, status: status.processing, leaseId: delivery.leaseId },
      data: {
        status: status.sent,
        sentAt: new Date(),
        lockedUntil: null,
        leaseId: null,
        lastError: null,
      },
    });
    return { delivered: true as const };
  } catch (error) {
    const exhausted = delivery.attempts >= MAX_ATTEMPTS;
    await prisma.announcementDelivery.updateMany({
      where: { id, status: status.processing, leaseId: delivery.leaseId },
      data: exhausted
        ? { status: status.failed, lockedUntil: null, leaseId: null, lastError: errorMessage(error) }
        : {
            status: status.pending,
            nextAttemptAt: new Date(Date.now() + emailRetryDelayMs(delivery.attempts)),
            lockedUntil: null,
            leaseId: null,
            lastError: errorMessage(error),
          },
    });
    console.error("[announcement-email] delivery failed", error);
    return { delivered: false as const };
  }
}

/** Processes due work serially to keep provider use bounded in serverless invocations. */
export async function deliverDueAnnouncementDeliveries(limit = 50) {
  const now = new Date();
  const deliveries = await prisma.announcementDelivery.findMany({
    where: {
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
  for (const delivery of deliveries) results.push(await deliverAnnouncementDelivery(delivery.id));
  return { claimed: deliveries.length, delivered: results.filter((result) => result.delivered).length };
}
