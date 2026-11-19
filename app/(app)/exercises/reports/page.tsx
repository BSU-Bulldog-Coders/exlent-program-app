import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ExerciseReports } from "@/components/exercises/exercise-reports";
import { ReportsSkeleton } from "./loading";
export default function ReportsPage() { return <><Link href="/exercises" className="flex w-fit items-center gap-1 text-sm text-muted-foreground"><ArrowLeftIcon /> Exercises</Link><div><h1 className="text-4xl">Testcase reports</h1><p className="text-sm text-muted-foreground">Review reports submitted by students.</p></div><Suspense fallback={<ReportsSkeleton />}><Content /></Suspense></>; }
async function Content() { await requireAdmin(); const reports = await prisma.testcaseReport.findMany({ include: { user: { select: { name: true } }, testcase: { include: { revision: { include: { exercise: { select: { id: true, title: true } } } } } } }, orderBy: { createdAt: "desc" } }); return <ExerciseReports initialReports={reports.map(r => ({ id: r.id, reason: r.reason, status: r.status, user: r.user, testcase: { position: r.testcase.position, input: r.testcase.input, expectedOutput: r.testcase.expectedOutput, exercise: r.testcase.revision.exercise } }))} />; }
