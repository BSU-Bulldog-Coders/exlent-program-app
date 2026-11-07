import { NextResponse } from "next/server";
import { parseClassListParams } from "@/lib/class-list-params";
import { listClasses } from "@/lib/classes";
import { getCurrentUser } from "@/lib/dal";

/** GET /api/classes?page=1&pageSize=10&q=intro. Admins see every class, students only non-drafts. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = parseClassListParams(Object.fromEntries(new URL(request.url).searchParams));
  const result = await listClasses({ id: user.id, role: user.role }, params);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
