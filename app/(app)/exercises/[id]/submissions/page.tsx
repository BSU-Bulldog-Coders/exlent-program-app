import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { ExerciseSubmissions } from "@/components/exercises/exercise-submissions";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { SubmissionsSkeleton } from "./loading";

export default function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<SubmissionsSkeleton />}><Content params={params} /></Suspense>;
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const [, { id }] = await Promise.all([requireAdmin(), params]);
  const [exercise, progress] = await Promise.all([
    prisma.exercise.findUnique({ where: { id }, select: { id: true, title: true, currentRevisionId: true } }),
    prisma.exerciseProgress.findMany({
      where: { exerciseId: id, user: { role: "STUDENT", deletionScheduledAt: null }, latestRunId: { not: null } },
      select: { user: { select: { id: true, name: true, image: true, totalScore: true } }, latestRun: { select: { createdAt: true } }, passedRevisionId: true },
      orderBy: { latestRun: { createdAt: "desc" } },
    }),
  ]);
  if (!exercise) notFound();
  const entries = progress.flatMap(item => item.latestRun ? [{ id: item.user.id, name: item.user.name, image: item.user.image, points: item.user.totalScore, submittedAt: item.latestRun.createdAt.toISOString(), passed: !!item.passedRevisionId && item.passedRevisionId === exercise.currentRevisionId }] : []);
  return <><Link href={`/exercises/${id}`} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeftIcon className="size-4" /> {exercise.title}</Link><div><h1 className="text-4xl">Submissions</h1><p className="text-sm text-muted-foreground">Latest submissions for {exercise.title}. Points are each student&apos;s current leaderboard total.</p></div><ExerciseSubmissions exerciseId={id} entries={entries} /></>;
}
