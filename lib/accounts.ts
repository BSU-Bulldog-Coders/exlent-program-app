import "server-only";
import { auth } from "@/lib/auth";

/**
 * Creates a credential (email + password) user directly, bypassing the public
 * sign-up endpoint. Used for invite redemption and the seed script, where the
 * email is already trusted and the role is decided server-side.
 */
export async function createCredentialUser(input: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "STUDENT";
  joinedVia: "INVITE" | "SEED";
}) {
  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash(input.password);
  const user = await ctx.internalAdapter.createUser(
    {
      name: input.name,
      email: input.email.toLowerCase(),
      emailVerified: true,
      role: input.role,
      joinedVia: input.joinedVia,
    },
    { method: "email-password" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: passwordHash,
  });
  return user;
}
