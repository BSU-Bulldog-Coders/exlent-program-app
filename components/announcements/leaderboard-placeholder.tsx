import { TrophyIcon } from "@phosphor-icons/react/ssr";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export function LeaderboardPlaceholder() {
  return (
    <aside className="hidden min-w-0 lg:block" aria-label="Leaderboard">
      <Card className="border ring-0 [--card-spacing:0]">
        <CardHeader className="border-b px-4 py-3">
          <CardTitle className="text-lg">Leaderboard</CardTitle>
          <CardAction>
            <TrophyIcon className="size-4 text-muted-foreground" />
          </CardAction>
        </CardHeader>
        <CardContent className="flex min-h-52 bg-muted/60 p-4">
          <Empty className="min-h-44 border-0 bg-transparent p-4 text-muted-foreground">
            <EmptyHeader>
              <EmptyTitle className="text-muted-foreground">Coming soon</EmptyTitle>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    </aside>
  );
}
