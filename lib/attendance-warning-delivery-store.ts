import "server-only";
import { prisma } from "@/lib/prisma";

// Data boundary for the warning-email worker, kept apart from the check's
// store so each can be tested with its own stand-in database.
export { prisma };
