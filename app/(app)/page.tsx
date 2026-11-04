import type { Metadata } from "next";
import { Suspense } from "react";
import { AnnouncementFeed } from "@/components/announcements/announcement-feed";
import { AnnouncementFeedSkeleton } from "@/components/announcements/announcement-feed-skeleton";
import { TopLeaderboard, TopLeaderboardSkeleton } from "@/components/leaderboard/top-leaderboard";
import { NewAnnouncementButton } from "@/components/announcements/new-announcement-button";

export const metadata: Metadata = { title: "Home" };

export default function HomePage() {
  return (
    <div className="grid w-full gap-6 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl">Home</h1>
            <p className="text-sm text-muted-foreground">Program announcements and updates.</p>
          </div>
          <Suspense fallback={null}>
            <NewAnnouncementButton />
          </Suspense>
        </div>
        <Suspense fallback={<AnnouncementFeedSkeleton />}>
          <AnnouncementFeed />
        </Suspense>
      </div>
      <Suspense fallback={<TopLeaderboardSkeleton />}>
        <TopLeaderboard />
      </Suspense>
    </div>
  );
}
