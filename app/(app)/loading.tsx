import { AnnouncementFeedSkeleton } from "@/components/announcements/announcement-feed-skeleton";
import { TopLeaderboardSkeleton } from "@/components/leaderboard/top-leaderboard";

export default function Loading() {
  return (
    <div className="grid w-full gap-6 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl">Home</h1>
            <p className="text-sm text-muted-foreground">Program announcements and updates.</p>
          </div>
        </div>
        <AnnouncementFeedSkeleton />
      </div>
      <TopLeaderboardSkeleton />
    </div>
  );
}
