import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { firstPassingSubmissions } from "@/lib/exercise-submissions";

type Context = { params: Promise<{ path?: string[] }> };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function handle(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  if (user.role !== "ADMIN") return json({ error: "Forbidden" }, 403);
  const [section, id, action] = (await params).path ?? [];
  if (section === "testcase-reports" && !id && request.method === "GET") return json(await prisma.testcaseReport.findMany({ include: { user: { select: { id: true, name: true } }, testcase: { include: { revision: { include: { exercise: { select: { id: true, title: true } } } } } } }, orderBy: { createdAt: "desc" } }));
  if (section === "testcase-reports" && id && request.method === "PATCH") {
    const data = await request.json().catch(() => null);
    if (!data || !["RESOLVED", "DISMISSED"].includes(data.status)) return json({ error: "Invalid status" }, 400);
    const result = await prisma.testcaseReport.updateMany({ where: { id, status: "OPEN" }, data: { status: data.status } });
    return result.count ? json({ success: true }) : json({ error: "Open report not found" }, 404);
  }
  if (section === "exercises" && id && action === "progress" && request.method === "GET") return json(await firstPassingSubmissions(id));
  return json({ error: "Not found" }, 404);
}
export { handle as GET, handle as PATCH };
