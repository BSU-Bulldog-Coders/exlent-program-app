import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Creates the very first admin, once.
 *
 * It runs on every production deploy (see scripts/vercel-build.mjs), so the
 * only thing that decides whether it does anything is the database itself:
 * if any admin already exists it exits immediately and never touches users.
 * Password hashing goes through Better Auth's internals so sign-in works.
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Program Admin";

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    if ((await prisma.user.count({ where: { role: "ADMIN" } })) > 0) {
      console.log("[seed] An admin already exists. Nothing to do.");
      return;
    }

    if (!email || !password) {
      console.warn("[seed] No admin exists yet, but ADMIN_EMAIL / ADMIN_PASSWORD are not set. Skipping.");
      return;
    }
    if (password.length < 8) {
      console.warn("[seed] ADMIN_PASSWORD must be at least 8 characters. Skipping.");
      return;
    }

    // Never promote an existing account: it may have been created through open
    // sign-up by someone else.
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      console.warn(
        `[seed] A non-admin account already uses ${email}. Not promoting it automatically. ` +
          "Choose a different ADMIN_EMAIL or promote the user manually.",
      );
      return;
    }

    // Imported lazily: lib/accounts pulls in the full auth config.
    const { createCredentialUser } = await import("../lib/accounts");
    try {
      await createCredentialUser({ name, email, password, role: "ADMIN", joinedVia: "SEED" });
      console.log(`[seed] Created the first admin (${email}).`);
    } catch (error) {
      // Two deploys racing on the first run: the loser sees the winner's admin.
      if ((await prisma.user.count({ where: { role: "ADMIN" } })) > 0) {
        console.log("[seed] An admin was created concurrently. Nothing to do.");
        return;
      }
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exit(1);
  });
