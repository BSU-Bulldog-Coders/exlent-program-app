import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { createRun, deleteExercise, detailInclude, exerciseInput, publishExercise, reportInput, runInput, saveExercise } from "@/lib/exercises";

export const maxDuration = 60;
type Context = { params: Promise<{ path?: string[] }> };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const invalid = () => json({ error: "Invalid request" }, 400);
async function body(request: Request) { try { return await request.json(); } catch { return null; } }
async function handle(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const path = (await params).path ?? [];
  const [id, action, extra, tail] = path;
  const method = request.method;
  const admin = user.role === "ADMIN";
  if (!id && method === "GET") {
    const classId = new URL(request.url).searchParams.get("classId");
    const items = await prisma.exercise.findMany({ where: { ...(admin ? {} : { status: "PUBLISHED" }), ...(classId ? { classes: { some: { classId } } } : {}) }, include: { classes: { include: { class: { select: { id: true, name: true } } } }, progress: { where: { userId: user.id } } }, orderBy: { createdAt: "desc" } });
    return json(items);
  }
  if (!id && method === "POST") {
    if (!admin) return json({ error: "Forbidden" }, 403);
    const data = exerciseInput.safeParse(await body(request));
    if (!data.success) return json({ error: data.error.issues[0]?.message || "Invalid request" }, 400);
    try { return json(await saveExercise(data.data, user.id), 201); } catch { return invalid(); }
  }
  if (!id) return json({ error: "Not found" }, 404);
  if (!action && method === "DELETE") {
    if (!admin) return json({ error: "Forbidden" }, 403);
    const deleted = await deleteExercise(id);
    return deleted ? json({ success: true }) : json({ error: "Not found" }, 404);
  }
  if (action === "publish" && !extra && method === "POST") {
    if (!admin) return json({ error: "Forbidden" }, 403);
    const result = await publishExercise(id);
    return "error" in result ? json({ error: result.error }, result.status) : json(result);
  }
  const exercise = await prisma.exercise.findUnique({ where: { id }, include: detailInclude });
  if (!exercise || (!admin && exercise.status !== "PUBLISHED")) return json({ error: "Not found" }, 404);
  if (!action && method === "GET") {
    const [progress, latestRun] = await Promise.all([
      prisma.exerciseProgress.findUnique({ where: { exerciseId_userId: { exerciseId: id, userId: user.id } } }),
      prisma.exerciseRun.findFirst({ where: { exerciseId: id, userId: user.id }, orderBy: { createdAt: "desc" }, select: { code: true } }),
    ]);
    return json({ ...exercise, progress, latestCode: latestRun?.code ?? null });
  }
  if (!action && method === "PATCH") {
    if (!admin) return json({ error: "Forbidden" }, 403);
    const data = exerciseInput.safeParse(await body(request));
    if (!data.success) return json({ error: data.error.issues[0]?.message || "Invalid request" }, 400);
    try { return json(await saveExercise(data.data, user.id, id)); } catch { return invalid(); }
  }
  if (action === "archive" && !extra && method === "POST") {
    if (!admin) return json({ error: "Forbidden" }, 403);
    return json(await prisma.exercise.update({ where: { id }, data: { status: "ARCHIVED" } }));
  }
  if (action === "runs" && !extra && method === "POST") {
    const data = runInput.safeParse(await body(request));
    if (!data.success) return invalid();
    const result = await createRun(id, user.id, data.data.code);
    return "error" in result ? json({ error: result.error }, result.status) : json(result, 201);
  }
  if (action === "runs" && method === "GET") {
    const requestedUser = new URL(request.url).searchParams.get("userId");
    if (requestedUser && requestedUser !== user.id && !admin) return json({ error: "Forbidden" }, 403);
    const where = { exerciseId: id, ...(admin && extra ? {} : { userId: requestedUser || user.id }) };
    if (extra) {
      const run = await prisma.exerciseRun.findFirst({ where: { ...where, id: extra }, include: { results: { include: { testcase: true } }, user: { select: { id: true, name: true } } } });
      return run ? json(run) : json({ error: "Not found" }, 404);
    }
    return json(await prisma.exerciseRun.findMany({ where, orderBy: { createdAt: "desc" }, include: { results: { include: { testcase: true } } } }));
  }
  if (action === "testcases" && extra && tail === "reports" && method === "POST") {
    const data = reportInput.safeParse(await body(request));
    if (!data.success) return invalid();
    const testcase = await prisma.testcaseRevision.findFirst({ where: { id: extra, revision: { exerciseId: id } } });
    if (!testcase) return json({ error: "Not found" }, 404);
    try { return json(await prisma.testcaseReport.create({ data: { testcaseId: extra, userId: user.id, reason: data.data.reason } }), 201); }
    catch { return json({ error: "You already have an open report for this testcase" }, 409); }
  }
  return json({ error: "Not found" }, 404);
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
