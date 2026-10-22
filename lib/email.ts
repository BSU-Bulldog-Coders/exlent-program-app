import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { InviteEmail } from "@/emails/invite-email";
import { VerifyEmail } from "@/emails/verify-email";
import { WelcomeEmail } from "@/emails/welcome-email";
import { appUrl } from "@/lib/env";

const DEFAULT_FROM = "ExLENT Program <onboarding@resend.dev>";

let resend: Resend | null = null;
function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return (resend ??= new Resend(key));
}

/**
 * Sends through Resend. Throws on delivery failure so callers decide whether it
 * is fatal (invites) or best-effort (welcome email, see sendBestEffort).
 * Without RESEND_API_KEY outside production the message is logged instead.
 */
async function send({
  to,
  subject,
  react,
  linkForLog,
}: {
  to: string;
  subject: string;
  react: ReactElement;
  linkForLog: string;
}) {
  const resendClient = client();
  if (!resendClient) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not set");
    }
    console.warn(`[email] RESEND_API_KEY not set. "${subject}" to ${to}: ${linkForLog}`);
    return;
  }
  const { error } = await resendClient.emails.send({
    from: process.env.RESEND_FROM ?? DEFAULT_FROM,
    to,
    subject,
    react,
  });
  if (error) {
    throw new Error(`Resend failed to send "${subject}": ${error.message}`);
  }
}

export async function sendBestEffort(task: Promise<unknown>) {
  try {
    await task;
  } catch (error) {
    console.error("[email] send failed", error);
  }
}

export function sendInviteEmail(args: {
  to: string;
  inviterName: string;
  role: "ADMIN" | "STUDENT";
  url: string;
}) {
  return send({
    to: args.to,
    subject: "You're invited to the ExLENT program",
    react: InviteEmail({ inviterName: args.inviterName, role: args.role, url: args.url }),
    linkForLog: args.url,
  });
}

export function sendVerificationEmail(args: { to: string; name: string; url: string }) {
  return send({
    to: args.to,
    subject: "Verify your email",
    react: VerifyEmail({ name: args.name, url: args.url }),
    linkForLog: args.url,
  });
}

export function sendWelcomeEmail(args: { to: string; name: string }) {
  const url = `${appUrl()}/`;
  return send({
    to: args.to,
    subject: "Welcome to the ExLENT program",
    react: WelcomeEmail({ name: args.name, url }),
    linkForLog: url,
  });
}
