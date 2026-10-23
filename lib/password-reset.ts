import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { EmailOutboxStatus } from "@/generated/prisma/client";
import { sendPasswordResetEmail } from "@/lib/email";
import { appUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const PASSWORD_RESET_TTL_MS = 24 * 60 * 60 * 1000;
export const EMAIL_OUTBOX_LEASE_MS = 5 * 60 * 1000;

type ResetPayload = { name: string; url: string };

export type PasswordResetRequestResult = "created" | "active" | "ignored";

function resetIdentifier(token: string) {
  return `reset-password:${token}`;
}

function resetUrl(token: string) {
  const url = new URL("/reset-password", appUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

function createResetToken() {
  return randomBytes(32).toString("base64url");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed";
}

function isResetPayload(payload: unknown): payload is ResetPayload {
  if (!payload || typeof payload !== "object") return false;
  const value = payload as Record<string, unknown>;
  return typeof value.name === "string" && typeof value.url === "string";
}

/** Exponential retry delay, capped so an active reset link is never held indefinitely. */
export function emailRetryDelayMs(attempts: number) {
  return Math.min(60 * 60 * 1000, 60_000 * 2 ** Math.max(0, attempts - 1));
}

/**
 * Creates exactly one active reset request per user. The row-level lock makes
 * duplicate clicks or concurrent admin/user requests reuse the same outbox
 * event and therefore the same provider idempotency key.
 */
export async function requestPasswordReset(input: { email: string }): Promise<PasswordResetRequestResult> {
  const email = input.email.trim().toLowerCase();
  const candidate = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  // Preserve the public flow's neutral response without issuing any token.
  if (!candidate) {
    createResetToken();
    return "ignored";
  }

  const issued = await prisma.$transaction(async (tx) => {
    // Serialize issuance for this user. This is Postgres-specific, which is
    // appropriate because the project is explicitly Postgres-only.
    await tx.$queryRaw`SELECT "id" FROM "user" WHERE "id" = ${candidate.id} FOR UPDATE`;
    const user = await tx.user.findUniqueOrThrow({
      where: { id: candidate.id },
      select: { id: true, email: true, name: true },
    });
    const now = new Date();
    const active = await tx.passwordResetRequest.findFirst({
      where: { userId: user.id, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      include: { outbox: { select: { id: true } } },
    });

    if (active) {
      const verification = await tx.verification.findFirst({
        where: { identifier: active.verificationIdentifier },
        select: { expiresAt: true },
      });
      if (verification && verification.expiresAt > now && active.outbox) {
        return { result: "active" as const, outboxId: active.outbox.id };
      }
    }

    const token = createResetToken();
    const identifier = resetIdentifier(token);
    const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TTL_MS);
    const requestId = randomUUID();
    const outboxId = randomUUID();
    const created = await tx.passwordResetRequest.create({
      data: {
        id: requestId,
        userId: user.id,
        verificationIdentifier: identifier,
        expiresAt,
        outbox: {
          create: {
            id: outboxId,
            kind: "PASSWORD_RESET",
            to: user.email,
            payload: { name: user.name, url: resetUrl(token) },
            idempotencyKey: `password-reset:${outboxId}`,
          },
        },
      },
      select: { id: true },
    });
    await tx.verification.create({
      data: {
        id: randomUUID(),
        identifier,
        value: user.id,
        expiresAt,
      },
    });
    return { result: "created" as const, outboxId, requestId: created.id };
  });

  // Delivery is deliberately after commit. A crash or provider timeout leaves
  // a durable pending event for the same idempotency key to be retried.
  await deliverOutboxEvent(issued.outboxId);
  return issued.result;
}

type ClaimedOutbox = {
  id: string;
  kind: "PASSWORD_RESET";
  to: string;
  payload: unknown;
  idempotencyKey: string;
  attempts: number;
  leaseId: string | null;
};

async function claimOutboxEvent(id: string): Promise<ClaimedOutbox | null> {
  const now = new Date();
  const leaseId = randomUUID();
  const leaseUntil = new Date(now.getTime() + EMAIL_OUTBOX_LEASE_MS);

  await prisma.emailOutbox.updateMany({
    where: {
      id,
      status: { in: [EmailOutboxStatus.PENDING, EmailOutboxStatus.PROCESSING] },
      passwordResetRequest: { expiresAt: { lte: now } },
    },
    data: {
      status: EmailOutboxStatus.ABANDONED,
      lockedUntil: null,
      leaseId: null,
      lastError: "Reset link expired before email delivery completed.",
    },
  });

  const updated = await prisma.emailOutbox.updateMany({
    where: {
      id,
      passwordResetRequest: { expiresAt: { gt: now } },
      OR: [
        { status: EmailOutboxStatus.PENDING, nextAttemptAt: { lte: now } },
        { status: EmailOutboxStatus.PROCESSING, lockedUntil: { lte: now } },
      ],
    },
    data: {
      status: EmailOutboxStatus.PROCESSING,
      leaseId,
      lockedUntil: leaseUntil,
      attempts: { increment: 1 },
    },
  });
  if (updated.count !== 1) return null;

  const event = await prisma.emailOutbox.findFirst({
    where: { id, leaseId },
    select: {
      id: true,
      kind: true,
      to: true,
      payload: true,
      idempotencyKey: true,
      attempts: true,
      leaseId: true,
    },
  });
  return event as ClaimedOutbox | null;
}

/** Safely deliver a single event. It never throws into a user-facing action. */
export async function deliverOutboxEvent(id: string) {
  const event = await claimOutboxEvent(id);
  if (!event || !event.leaseId) return { delivered: false as const };

  try {
    if (event.kind !== "PASSWORD_RESET" || !isResetPayload(event.payload)) {
      throw new Error("Invalid password reset email payload.");
    }
    await sendPasswordResetEmail({
      to: event.to,
      name: event.payload.name,
      url: event.payload.url,
      idempotencyKey: event.idempotencyKey,
    });
    await prisma.emailOutbox.updateMany({
      where: { id: event.id, status: EmailOutboxStatus.PROCESSING, leaseId: event.leaseId },
      data: {
        status: EmailOutboxStatus.SENT,
        sentAt: new Date(),
        lockedUntil: null,
        leaseId: null,
        lastError: null,
      },
    });
    return { delivered: true as const };
  } catch (error) {
    await prisma.emailOutbox.updateMany({
      where: { id: event.id, status: EmailOutboxStatus.PROCESSING, leaseId: event.leaseId },
      data: {
        status: EmailOutboxStatus.PENDING,
        nextAttemptAt: new Date(Date.now() + emailRetryDelayMs(event.attempts)),
        lockedUntil: null,
        leaseId: null,
        lastError: errorMessage(error),
      },
    });
    console.error("[email-outbox] delivery failed", error);
    return { delivered: false as const };
  }
}

/** Claims and delivers a small batch for the cron recovery path. */
export async function deliverDueOutboxEvents(limit = 20) {
  const now = new Date();
  await prisma.emailOutbox.updateMany({
    where: {
      status: { in: [EmailOutboxStatus.PENDING, EmailOutboxStatus.PROCESSING] },
      passwordResetRequest: { expiresAt: { lte: now } },
    },
    data: {
      status: EmailOutboxStatus.ABANDONED,
      lockedUntil: null,
      leaseId: null,
      lastError: "Reset link expired before email delivery completed.",
    },
  });
  const events = await prisma.emailOutbox.findMany({
    where: {
      passwordResetRequest: { expiresAt: { gt: now } },
      OR: [
        { status: EmailOutboxStatus.PENDING, nextAttemptAt: { lte: now } },
        { status: EmailOutboxStatus.PROCESSING, lockedUntil: { lte: now } },
      ],
    },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
    select: { id: true },
  });
  const results = [];
  for (const event of events) results.push(await deliverOutboxEvent(event.id));
  return { claimed: events.length, delivered: results.filter((result) => result.delivered).length };
}
