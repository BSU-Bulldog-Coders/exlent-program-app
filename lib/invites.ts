import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/env";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

export function generateInviteToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInviteToken(token) };
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function inviteUrl(token: string) {
  return `${appUrl()}/sign-up?invite=${encodeURIComponent(token)}`;
}

export function inviteStatus(invite: {
  acceptedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
}): InviteStatus {
  if (invite.acceptedAt) return "accepted";
  if (invite.revokedAt) return "revoked";
  if (invite.expiresAt.getTime() <= Date.now()) return "expired";
  return "pending";
}

export async function findInviteByToken(token: string) {
  const invite = await prisma.invite.findUnique({
    where: { tokenHash: hashInviteToken(token) },
  });
  if (!invite) return null;
  return { invite, status: inviteStatus(invite) };
}

export async function hasPendingInvite(email: string) {
  const count = await prisma.invite.count({
    where: {
      email: email.toLowerCase(),
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  return count > 0;
}
