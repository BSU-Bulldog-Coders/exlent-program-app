import { LeaderboardPageHeader, LeaderboardPageSkeleton } from "@/components/leaderboard/leaderboard-page-skeleton";

export default function Loading() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <LeaderboardPageHeader />
      <LeaderboardPageSkeleton />
    </div>
  );
}
