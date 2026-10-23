"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { sendInviteEmail } from "@/lib/email";
import { INVITE_TTL_MS, generateInviteToken, inviteStatus, inviteUrl } from "@/lib/invites";
import { prisma } from "@/lib/prisma";
import { requestPasswordReset } from "@/lib/password-reset";

export type InviteResult = { ok: true } | { ok: false; error: string };
export type PasswordResetResult = { ok: true; active: boolean } | { ok: false; error: string };

const inviteSchema = z.object({
  email: z.email("Enter a valid email address.").transform((value) => value.toLowerCase()),
  role: z.enum(["STUDENT", "ADMIN"]),
});

async function deliver(invite: { email: string; role: "ADMIN" | "STUDENT" }, token: string, inviterName: string) {
  try {
    await sendInviteEmail({
      to: invite.email,
      inviterName,
      role: invite.role,
      url: inviteUrl(token),
    });
    return null;
  } catch (error) {
    console.error("[invite] email failed", error);
    return "The invite was saved but the email could not be sent. Use Resend to try again.";
  }
}

export async function inviteUser(input: z.input<typeof inviteSchema>): Promise<InviteResult> {
  const admin = await requireAdmin();
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { email, role } = parsed.data;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { ok: false, error: "Someone with this email already has an account." };
  }

  const { token, tokenHash } = generateInviteToken();
  // A new invite supersedes any earlier open one for the same address.
  await prisma.$transaction([
    prisma.invite.updateMany({
      where: { email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.invite.create({
      data: {
        email,
        role,
        tokenHash,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        invitedById: admin.id,
      },
    }),
  ]);
  revalidatePath("/admin/people");

  const failure = await deliver({ email, role }, token, admin.name);
  return failure ? { ok: false, error: failure } : { ok: true };
}

export async function resendInvite(inviteId: string): Promise<InviteResult> {
  const admin = await requireAdmin();
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.acceptedAt || invite.revokedAt) {
    return { ok: false, error: "This invite can no longer be resent." };
  }

  const { token, tokenHash } = generateInviteToken();
  await prisma.invite.update({
    where: { id: invite.id },
    data: { tokenHash, expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
  });
  revalidatePath("/admin/people");

  const failure = await deliver(invite, token, admin.name);
  return failure ? { ok: false, error: failure } : { ok: true };
}

export async function revokeInvite(inviteId: string): Promise<InviteResult> {
  await requireAdmin();
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite || inviteStatus(invite) === "accepted") {
    return { ok: false, error: "This invite can't be revoked." };
  }
  await prisma.invite.update({ where: { id: invite.id }, data: { revokedAt: new Date() } });
  revalidatePath("/admin/people");
  return { ok: true };
}

/** Admin-triggered reset uses the same deduplicated issuance service as users. */
export async function sendPasswordReset(userId: string): Promise<PasswordResetResult> {
  await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return { ok: false, error: "This person no longer has an account." };

  const result = await requestPasswordReset({ email: user.email });
  return { ok: true, active: result === "active" };
}
