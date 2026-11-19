import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type FirstPassingSubmission = {
  studentId: string;
  name: string;
  image: string | null;
  points: number;
  runId: string;
  submittedAt: Date;
  completedAt: Date | null;
};

/** Earliest passing run for each active student on the exercise's current revision. */
export async function firstPassingSubmissions(exerciseId: string, db: Pick<Prisma.TransactionClient, "$queryRaw"> = prisma): Promise<FirstPassingSubmission[]> {
  return db.$queryRaw<FirstPassingSubmission[]>`
    SELECT
      u.id AS "studentId",
      u.name,
      u.image,
      u.total_score AS points,
      first_run.id AS "runId",
      first_run."createdAt" AS "submittedAt",
      first_run."completedAt" AS "completedAt"
    FROM "Exercise" AS exercise
    JOIN "user" AS u ON u.role = 'STUDENT' AND u."deletionScheduledAt" IS NULL
    JOIN LATERAL (
      SELECT r.id, r."createdAt", r."completedAt"
      FROM "ExerciseRun" AS r
      WHERE r."userId" = u.id
        AND r."exerciseId" = exercise.id
        AND r."revisionId" = exercise."currentRevisionId"
        AND r.status = 'PASSED'
      ORDER BY r."createdAt" ASC, r.id ASC
      LIMIT 1
    ) AS first_run ON TRUE
    WHERE exercise.id = ${exerciseId}
    ORDER BY first_run."createdAt" ASC, u.id ASC
  `;
}
