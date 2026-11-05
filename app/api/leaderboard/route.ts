import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dal";
import { MAX_PAGE_SIZE, getLeaderboard } from "@/lib/leaderboard";

function intParam(value: string | null, fallback: number) {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const page = intParam(params.get("page"), 1);
  const pageSize = Math.min(intParam(params.get("pageSize"), 20), MAX_PAGE_SIZE);
  const { entries, total } = await getLeaderboard({ limit: pageSize, offset: (page - 1) * pageSize });

  return NextResponse.json(
    { entries, total, page, pageSize },
    { headers: { "Cache-Control": "no-store" } },
  );
}
