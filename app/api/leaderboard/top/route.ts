import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dal";
import { TOP_LIMIT, getLeaderboard } from "@/lib/leaderboard";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entries } = await getLeaderboard({ limit: TOP_LIMIT });
  return NextResponse.json({ entries }, { headers: { "Cache-Control": "no-store" } });
}
