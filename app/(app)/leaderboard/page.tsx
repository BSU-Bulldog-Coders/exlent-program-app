import type { Metadata } from "next";
import { Suspense } from "react";
import { LeaderboardPageContent } from "@/components/leaderboard/leaderboard-page-content";
import { LeaderboardPageHeader, LeaderboardPageSkeleton } from "@/components/leaderboard/leaderboard-page-skeleton";

export const metadata: Metadata = { title: "Leaderboard" };

export default function LeaderboardPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <LeaderboardPageHeader />
      <Suspense fallback={<LeaderboardPageSkeleton />}>
        <LeaderboardPageContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
