import Link from "next/link";
import { TrophyIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardList } from "@/components/leaderboard/leaderboard-list";
import { LeaderboardRowsSkeleton } from "@/components/leaderboard/leaderboard-skeleton";
import { requireUser } from "@/lib/dal";
import { TOP_LIMIT, getLeaderboard } from "@/lib/leaderboard";

/** Shell shared by the live card and its skeleton so they cannot drift. */
export function LeaderboardCard({ children }: { children: React.ReactNode }) {
  return (
    <aside className="hidden min-w-0 lg:block" aria-label="Leaderboard">
      <Card className="border ring-0 [--card-spacing:0]">
        <CardHeader className="border-b px-4 py-3">
          <CardTitle className="text-lg">Leaderboard</CardTitle>
          <CardAction>
            <TrophyIcon className="size-4 text-muted-foreground" />
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">{children}</CardContent>
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full" render={<Link href="/leaderboard" />}>
            View full leaderboard
          </Button>
        </div>
      </Card>
    </aside>
  );
}

export function TopLeaderboardSkeleton() {
  return (
    <LeaderboardCard>
      <LeaderboardRowsSkeleton rows={TOP_LIMIT} />
    </LeaderboardCard>
  );
}

export async function TopLeaderboard() {
  const user = await requireUser();
  const { entries } = await getLeaderboard({ limit: TOP_LIMIT });
  return (
    <LeaderboardCard>
      <LeaderboardList entries={entries} currentUserId={user.id} />
    </LeaderboardCard>
  );
}
