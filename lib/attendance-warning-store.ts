import "server-only";
import { prisma } from "@/lib/prisma";

// Feature-level boundary for the missed-classes check: the data client and the
// scheduled-deletion primitive it needs, kept separate from unrelated flows so
// the logic can be exercised without the real database or deletion module.
export { prisma };
export { scheduleUserDeletionInTx } from "@/lib/user-deletion";
