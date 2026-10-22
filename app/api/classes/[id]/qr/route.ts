import { NextResponse } from "next/server";
import { ATTENDANCE_TOKEN_ROTATE_MS, createAttendanceToken } from "@/lib/attendance-token";
import { getCurrentUser } from "@/lib/dal";
import { appUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, ctx: RouteContext<"/api/classes/[id]/qr">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const found = await prisma.class.findUnique({ where: { id }, select: { status: true } });
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (found.status !== "OPEN") {
    return NextResponse.json({ error: "Class is not open" }, { status: 409 });
  }

  const { token, expiresAt } = createAttendanceToken(id);
  return NextResponse.json(
    {
      url: `${appUrl()}/attend?t=${encodeURIComponent(token)}`,
      expiresAt,
      rotateMs: ATTENDANCE_TOKEN_ROTATE_MS,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
