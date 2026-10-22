import { NextResponse } from "next/server";
import { getClassAttendance } from "@/lib/classes";
import { getCurrentUser } from "@/lib/dal";

export async function GET(_request: Request, ctx: RouteContext<"/api/classes/[id]/attendees">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  return NextResponse.json(await getClassAttendance(id), {
    headers: { "Cache-Control": "no-store" },
  });
}
