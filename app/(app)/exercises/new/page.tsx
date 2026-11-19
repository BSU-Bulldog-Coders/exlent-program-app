import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ExerciseFormSkeleton } from "./loading";
export default function NewExercisePage() { return <><Link href="/exercises" className="flex w-fit items-center gap-1 text-sm text-muted-foreground"><ArrowLeftIcon /> Exercises</Link><div><h1 className="text-4xl">New exercise</h1><p className="text-sm text-muted-foreground">Create an exercise for students to practice Python.</p></div><Suspense fallback={<ExerciseFormSkeleton />}><Content /></Suspense></>; }
async function Content() { await requireAdmin(); const classes = await prisma.class.findMany({ select: { id: true, name: true }, orderBy: { startsAt: "desc" } }); return <ExerciseForm classes={classes} />; }
