import { LeaderboardRowsSkeleton } from "@/components/leaderboard/leaderboard-skeleton";
import { PaginationRow } from "@/components/leaderboard/pagination-row";
import { Card } from "@/components/ui/card";

export function LeaderboardPageSkeleton() {
  return (
    <>
      <Card className="border ring-0 [--card-spacing:0]">
        <LeaderboardRowsSkeleton rows={10} />
      </Card>
      <PaginationRow />
    </>
  );
}

export function LeaderboardPageHeader() {
  return (
    <div>
      <h1 className="text-4xl">Leaderboard</h1>
      <p className="text-sm text-muted-foreground">Every student, ranked by points.</p>
    </div>
  );
}
