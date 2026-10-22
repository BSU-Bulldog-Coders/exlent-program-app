"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createCredentialUser } from "@/lib/accounts";
import { auth } from "@/lib/auth";
import { homePathFor } from "@/lib/dal";
import { sendBestEffort, sendWelcomeEmail } from "@/lib/email";
import { findInviteByToken } from "@/lib/invites";
import { prisma } from "@/lib/prisma";

export type AcceptInviteState = { error?: string };

const schema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(1, "Enter your name.").max(100),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});

/**
 * Redeems an invite: the email is taken from the invite (never from the form),
 * the account is created already verified, and the role comes from the invite.
 */
export async function acceptInvite(
  _prev: AcceptInviteState,
  formData: FormData,
): Promise<AcceptInviteState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { token, name, password } = parsed.data;

  const found = await findInviteByToken(token);
  if (!found || found.status !== "pending") {
    return { error: "This invitation is no longer valid. Ask an admin to send a new one." };
  }
  const { invite } = found;

  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) return { error: "An account with this email already exists. Try signing in." };

  // Claim the invite atomically so a link can't be redeemed twice.
  const claimed = await prisma.invite.updateMany({
    where: { id: invite.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    data: { acceptedAt: new Date() },
  });
  if (claimed.count === 0) {
    return { error: "This invitation is no longer valid. Ask an admin to send a new one." };
  }

  try {
    await createCredentialUser({
      name,
      email: invite.email,
      password,
      role: invite.role,
      joinedVia: "INVITE",
    });
  } catch (error) {
    console.error("[invite] account creation failed", error);
    await prisma.invite.update({ where: { id: invite.id }, data: { acceptedAt: null } });
    return { error: "Could not create your account. Please try again." };
  }

  await sendBestEffort(sendWelcomeEmail({ to: invite.email, name }));
  await auth.api.signInEmail({
    body: { email: invite.email, password },
    headers: await headers(),
  });
  redirect(homePathFor(invite.role));
}
