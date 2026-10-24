import "server-only";
import { prisma } from "@/lib/prisma";

// Feature-level data boundary keeps announcement persistence independent from
// unrelated transactional-email flows.
export { prisma };
