import "server-only";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { runPython, MAX_BYTES } from "@/lib/exercise-runner";
import { testcaseValidationError } from "@/lib/exercise-validation";

const bounded = z.string().refine(value => Buffer.byteLength(value) <= MAX_BYTES, "Maximum size is 64 KB");
export const exerciseInput = z.object({ title: z.string().trim().min(1).max(200), description: z.string().max(30000), starterCode: bounded, classIds: z.array(z.string()).max(100), testcases: z.array(z.object({ input: bounded, expectedOutput: bounded })).max(10).superRefine((cases, ctx) => { const error = testcaseValidationError(cases); if (error) ctx.addIssue({ code: "custom", message: error }); }) });
export const runInput = z.object({ code: bounded });
export const reportInput = z.object({ reason: z.string().trim().min(1).max(2000) });
export type ExerciseInput = z.infer<typeof exerciseInput>;
export const detailInclude = { currentRevision: { include: { testcases: { orderBy: { position: "asc" as const } } } }, classes: { include: { class: { select: { id: true, name: true } } } } };
export async function saveExercise(data: ExerciseInput, creatorId: string, id?: string) {
  return prisma.$transaction(async tx => {
    if (id) await tx.$queryRaw`SELECT id FROM "Exercise" WHERE id = ${id} FOR UPDATE`;
    const old = id ? await tx.exercise.findUnique({ where: { id }, include: detailInclude }) : null;
    if (id && !old) return null;
    const exercise = old ? await tx.exercise.update({ where: { id: old.id }, data: { title: data.title, description: data.description, starterCode: data.starterCode } }) : await tx.exercise.create({ data: { title: data.title, description: data.description, starterCode: data.starterCode, creatorId } });
    await tx.exerciseClass.deleteMany({ where: { exerciseId: exercise.id } });
    await tx.exerciseClass.createMany({ data: [...new Set(data.classIds)].map(classId => ({ exerciseId: exercise.id, classId })) });
    const previous = old?.currentRevision?.testcases.map(({ input, expectedOutput }) => ({ input, expectedOutput }));
    if (!previous || JSON.stringify(previous) !== JSON.stringify(data.testcases)) {
      const revision = await tx.exerciseRevision.create({ data: { exerciseId: exercise.id, number: (old?.currentRevision?.number ?? 0) + 1, testcases: { create: data.testcases.map((testcase, position) => ({ ...testcase, position })) } } });
      await tx.exercise.update({ where: { id: exercise.id }, data: { currentRevisionId: revision.id } });
    }
    return tx.exercise.findUnique({ where: { id: exercise.id }, include: detailInclude });
  });
}
/** Serialize publishing with edits so the checked revision is the one being published. */
export async function publishExercise(id: string) {
  return prisma.$transaction(async tx => {
    const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Exercise" WHERE id = ${id} FOR UPDATE`;
    if (!rows.length) return { error: "Exercise not found.", status: 404 } as const;
    const exercise = await tx.exercise.findUnique({ where: { id }, include: { currentRevision: { include: { testcases: { orderBy: { position: "asc" } } } } } });
    const error = testcaseValidationError(exercise?.currentRevision?.testcases ?? []);
    if (error) return { error, status: 400 } as const;
    return tx.exercise.update({ where: { id }, data: { status: "PUBLISHED" } });
  });
}
export async function createRun(exerciseId: string, userId: string, code: string) {
  const started = performance.now();
  const timings: Record<string, number> = {};
  const time = async <T>(label: string, operation: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try { return await operation(); }
    finally { timings[label] = Math.round(performance.now() - start); }
  };
  try {
  const run = await time("database.start_transaction", () => prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    const exercise = await tx.exercise.findFirst({ where: { id: exerciseId, status: "PUBLISHED" }, include: { currentRevision: { include: { testcases: { orderBy: { position: "asc" } } } } } });
    if (!exercise?.currentRevision || !exercise.currentRevision.testcases.length) return { error: "Exercise not found", status: 404 } as const;
    const count = await tx.exerciseRun.count({ where: { userId, createdAt: { gte: new Date(Date.now() - 60_000) } } });
    if (count >= 10) return { error: "Run limit reached. Try again shortly.", status: 429 } as const;
    const created = await tx.exerciseRun.create({ data: { exerciseId, userId, revisionId: exercise.currentRevision.id, code } });
    await tx.exerciseProgress.upsert({ where: { exerciseId_userId: { exerciseId, userId } }, create: { exerciseId, userId, latestRunId: created.id }, update: { latestRunId: created.id } });
    return { created, cases: exercise.currentRevision.testcases };
  }));
  if ("error" in run) return run;
  const outcome = await time("sandbox.total", () => runPython(code, run.cases, time));
  const passed = outcome.results.every(result => result.status === "PASSED") && !outcome.failureReason;
  return await time("database.finish_transaction", () => prisma.$transaction(async tx => {
    const completed = await tx.exerciseRun.update({ where: { id: run.created.id }, data: { status: passed ? "PASSED" : "FAILED", failureReason: outcome.failureReason, completedAt: new Date(), results: { create: outcome.results } }, include: { results: { include: { testcase: true } } } });
    // Serialize completion updates so simultaneous runs cannot erase a newer pass.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    const current = await tx.exerciseProgress.findUnique({ where: { exerciseId_userId: { exerciseId, userId } }, include: { latestRun: true } });
    const latest = !current?.latestRun || current.latestRun.createdAt <= run.created.createdAt;
    await tx.$queryRaw`SELECT id FROM "Exercise" WHERE id = ${exerciseId} FOR UPDATE`;
    const exercise = await tx.exercise.findUnique({ where: { id: exerciseId }, select: { currentRevisionId: true } });
    const passedRevisionId = passed && exercise?.currentRevisionId === run.created.revisionId ? run.created.revisionId : undefined;
    await tx.exerciseProgress.upsert({ where: { exerciseId_userId: { exerciseId, userId } }, create: { exerciseId, userId, latestRunId: completed.id, passedRevisionId }, update: { ...(latest ? { latestRunId: completed.id } : {}), ...(passedRevisionId ? { passedRevisionId } : {}) } });
    return completed;
  }));
  } finally {
    console.info("[exercise-run timings in ms]", { ...timings, total: Math.round(performance.now() - started) });
  }
}

/** Remove dependent runs first so their restricted revision references cannot block deletion. */
export async function deleteExerciseInTx(tx: Prisma.TransactionClient, id: string): Promise<boolean> {
  const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Exercise" WHERE id = ${id} FOR UPDATE`;
  if (!rows.length) return false;
  await tx.exerciseRun.deleteMany({ where: { exerciseId: id } });
  await tx.exercise.delete({ where: { id } });
  return true;
}

export function deleteExercise(id: string): Promise<boolean> {
  return prisma.$transaction(tx => deleteExerciseInTx(tx, id));
}
