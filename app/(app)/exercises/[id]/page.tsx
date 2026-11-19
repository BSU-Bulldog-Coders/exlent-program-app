import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { ExercisePractice } from "@/components/exercises/exercise-practice";
import { DetailSkeleton } from "./loading";
import { exerciseReturnPath } from "@/lib/exercise-return-path";
export default function ExercisePage({ params, searchParams }: PageProps<"/exercises/[id]">) { return <Suspense fallback={<DetailSkeleton />}><Content params={params} searchParams={searchParams} /></Suspense>; }
async function Content({ params, searchParams }: { params: PageProps<"/exercises/[id]">["params"]; searchParams: PageProps<"/exercises/[id]">["searchParams"] }) {
  const [user, { id }, { returnTo }] = await Promise.all([requireUser(), params, searchParams]);
  const backHref = exerciseReturnPath(returnTo);
  const [exercise, classes] = await Promise.all([prisma.exercise.findFirst({ where: { id, ...(user.role === "ADMIN" ? {} : { status: "PUBLISHED" }) }, include: { currentRevision: { include: { testcases: { orderBy: { position: "asc" } } } }, classes: { include: { class: { select: { id: true, name: true } } } }, progress: { where: { userId: user.id } } } }), user.role === "ADMIN" ? prisma.class.findMany({ select: { id: true, name: true }, orderBy: { startsAt: "desc" } }) : []]);
  if (!exercise) notFound();
  const latestRun = await prisma.exerciseRun.findFirst({ where: { exerciseId: id, userId: user.id }, orderBy: { createdAt: "desc" }, select: { code: true } });
  return <>{user.role === "ADMIN" ? <><Link href={backHref} className="flex w-fit items-center gap-1 text-sm text-muted-foreground"><ArrowLeftIcon /> {backHref === "/exercises" ? "Exercises" : "Class"}</Link><ExerciseForm exercise={exercise} classes={classes} />{exercise.status === "PUBLISHED" && <ExercisePractice exerciseId={id} userId={user.id} starterCode={exercise.starterCode} latestCode={latestRun?.code ?? null} title={exercise.title} description={exercise.description} testcases={exercise.currentRevision?.testcases ?? []} />}</> : <div className="-m-4 md:-m-6"><ExercisePractice exerciseId={id} userId={user.id} starterCode={exercise.starterCode} latestCode={latestRun?.code ?? null} title={exercise.title} description={exercise.description} testcases={exercise.currentRevision?.testcases ?? []} backHref={backHref} pageTitle /></div>}</>;
}
