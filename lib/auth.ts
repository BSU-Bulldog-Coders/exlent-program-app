import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { appUrl } from "@/lib/env";
import { sendBestEffort, sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { hasPendingInvite } from "@/lib/invites";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  baseURL: appUrl(),
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Open sign-up must verify the address. Invited users are created already
    // verified (see lib/accounts.ts), since the invite email proves ownership.
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendBestEffort(sendVerificationEmail({ to: user.email, name: user.name, url }));
    },
    afterEmailVerification: async (user) => {
      await sendBestEffort(sendWelcomeEmail({ to: user.email, name: user.name }));
    },
  },
  user: {
    additionalFields: {
      // input: false means clients can never set these through the auth API.
      // Public sign-up therefore always yields a STUDENT.
      role: { type: "string", required: false, defaultValue: "STUDENT", input: false },
      joinedVia: { type: "string", required: false, defaultValue: "SELF", input: false },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const email = typeof ctx.body?.email === "string" ? ctx.body.email : "";
      if (email && (await hasPendingInvite(email))) {
        throw new APIError("BAD_REQUEST", {
          message: "You've been invited. Use the link in your invitation email to sign up.",
        });
      }
    }),
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
