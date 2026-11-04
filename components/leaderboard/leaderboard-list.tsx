import { UserAvatar } from "@/components/app/user-avatar";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/leaderboard";

export function LeaderboardList({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}) {
  if (entries.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No students on the leaderboard yet.</p>;
  }
  return (
    <ol className="divide-y">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className={cn("flex items-center gap-3 px-4 py-3", entry.id === currentUserId && "bg-muted/60")}
        >
          <span className="w-6 text-center text-sm font-medium tabular-nums text-muted-foreground">
            {entry.position}
          </span>
          <UserAvatar user={{ id: entry.id, name: entry.name, image: entry.image }} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm">{entry.name}</span>
          <span className="text-sm font-medium tabular-nums">{entry.score}</span>
        </li>
      ))}
    </ol>
  );
}
