import Link from "next/link";
import { PaginationRow } from "@/components/leaderboard/pagination-row";
import { Card } from "@/components/ui/card";
import { LeaderboardList } from "@/components/leaderboard/leaderboard-list";
import { requireUser } from "@/lib/dal";
import { getLeaderboard } from "@/lib/leaderboard";

export const LEADERBOARD_PAGE_SIZE = 20;

export async function LeaderboardPageContent({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  const { page: rawPage } = await searchParams;
  const requested = Number.parseInt(rawPage ?? "1", 10);
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1;
  const { entries, total } = await getLeaderboard({
    limit: LEADERBOARD_PAGE_SIZE,
    offset: (page - 1) * LEADERBOARD_PAGE_SIZE,
  });
  const pages = Math.max(1, Math.ceil(total / LEADERBOARD_PAGE_SIZE));

  return (
    <>
      <Card className="border ring-0 [--card-spacing:0]">
        <LeaderboardList entries={entries} currentUserId={user.id} />
      </Card>
      <PaginationRow
        page={page}
        pages={pages}
        prev={page > 1 ? <Link href={`/leaderboard?page=${page - 1}`} /> : undefined}
        next={page < pages ? <Link href={`/leaderboard?page=${page + 1}`} /> : undefined}
      />
    </>
  );
}
