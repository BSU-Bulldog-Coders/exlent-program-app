import "server-only";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/dal";

export function listExercises(user: Pick<CurrentUser, "id" | "role">, classId?: string) {
  return prisma.exercise.findMany({
    where: {
      ...(user.role === "ADMIN" ? {} : { status: "PUBLISHED" }),
      ...(classId ? { classes: { some: { classId } } } : {}),
    },
    select: {
      id: true,
      title: true,
      status: true,
      currentRevisionId: true,
      classes: { select: { class: { select: { name: true } } } },
      progress: { where: { userId: user.id }, select: { passedRevisionId: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
export type ExerciseListItem = Awaited<ReturnType<typeof listExercises>>[number];
