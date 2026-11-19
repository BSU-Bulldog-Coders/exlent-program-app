import { Suspense } from "react";
import { requireUser } from "@/lib/dal";
import { listExercises } from "@/lib/exercise-list";
import { ExerciseTable } from "@/components/exercises/exercise-table";
import { ExerciseListActions } from "@/components/exercises/exercise-list-actions";
import { ExerciseSkeleton } from "./loading";
import { ExercisesHeader } from "@/components/exercises/exercises-header";

export default function ExercisesPage() { return <><ExercisesHeader /><Suspense fallback={<ExerciseSkeleton />}><Content /></Suspense></>; }
async function Content() {
  const user = await requireUser();
  const items = await listExercises(user);
  return <div className="space-y-4"><div className="flex flex-wrap justify-end gap-3">{user.role === "ADMIN" && <ExerciseListActions />}</div><ExerciseTable exercises={items} isAdmin={user.role === "ADMIN"} /></div>;
}
