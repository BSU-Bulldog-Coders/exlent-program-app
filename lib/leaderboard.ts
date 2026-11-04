import "server-only";
import { resolveAvatarUrl } from "@/lib/avatar";
import { prisma } from "@/lib/prisma";

export const MAX_SCORE = 32767;
export const TOP_LIMIT = 10;
export const MAX_PAGE_SIZE = 50;

export type LeaderboardEntry = {
  id: string;
  name: string;
  image: string;
  score: number;
  position: number;
};

type Row = { id: string; name: string; image: string | null; score: number; position: bigint | number };

/**
 * Active students by score, highest first. Equal scores share a position with
 * no gap after them (1, 2, 2, 3) and are listed by name. Positions are ranked
 * over the whole table before paging, so they are right on every page.
 */
export async function getLeaderboard({ limit, offset = 0 }: { limit: number; offset?: number }) {
  const [rows, totals] = await Promise.all([
    prisma.$queryRaw<Row[]>`
      SELECT id, name, image, total_score AS score,
             DENSE_RANK() OVER (ORDER BY total_score DESC) AS position
      FROM "user"
      WHERE role = 'STUDENT' AND "deletionScheduledAt" IS NULL
      ORDER BY total_score DESC, name ASC, id ASC
      LIMIT ${limit} OFFSET ${offset}`,
    prisma.user.count({ where: { role: "STUDENT", deletionScheduledAt: null } }),
  ]);

  const entries: LeaderboardEntry[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    image: resolveAvatarUrl({ id: row.id, name: row.name, image: row.image }),
    score: Number(row.score),
    position: Number(row.position),
  }));
  return { entries, total: totals };
}

export class ScoreAdjustmentError extends Error {}

/**
 * Add or remove points exactly once per idempotencyKey. The key's unique row is
 * inserted first (ON CONFLICT DO NOTHING blocks while a concurrent request with
 * the same key is in flight), so a duplicate never touches the score and gets
 * the original result back. The score change itself is one atomic clamped
 * UPDATE, so different keys racing on one student cannot lose updates.
 */
export async function adjustScore(input: {
  userId: string;
  adminId: string;
  delta: number;
  idempotencyKey: string;
}): Promise<{ score: number; replayed: boolean }> {
  const { userId, adminId, delta, idempotencyKey } = input;
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > MAX_SCORE) {
    throw new ScoreAdjustmentError("Enter a whole number of points between 1 and 32767.");
  }

  return prisma.$transaction(async (tx) => {
    const inserted = await tx.scoreAdjustment.createMany({
      data: [{ idempotencyKey, userId, adminId, delta, resultingScore: 0 }],
      skipDuplicates: true,
    });

    if (inserted.count === 0) {
      const existing = await tx.scoreAdjustment.findUnique({ where: { idempotencyKey } });
      if (!existing || existing.userId !== userId || existing.delta !== delta) {
        throw new ScoreAdjustmentError("This request key was already used for a different change.");
      }
      return { score: existing.resultingScore, replayed: true };
    }

    const updated = await tx.$queryRaw<{ score: number }[]>`
      UPDATE "user"
      SET total_score = LEAST(${MAX_SCORE}, GREATEST(0, total_score + ${delta}))
      WHERE id = ${userId} AND role = 'STUDENT' AND "deletionScheduledAt" IS NULL
      RETURNING total_score AS score`;
    if (updated.length === 0) throw new ScoreAdjustmentError("Student not found.");

    const score = Number(updated[0].score);
    await tx.scoreAdjustment.update({ where: { idempotencyKey }, data: { resultingScore: score } });
    return { score, replayed: false };
  });
}
