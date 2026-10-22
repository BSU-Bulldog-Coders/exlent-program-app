import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Mirrors app/(app)/admin/page.tsx: static copy renders as-is, and only the
// values that come from the session or database are skeletons. Inline-block
// skeletons sized in em/line-height units sit inside the same text elements as
// the real content, so nothing shifts when the data arrives.
const STAT_LABELS = ["Students", "Classes", "Open now", "Pending invites"];
const RECENT_ROWS = 5;

export const ADMIN_OVERVIEW_STATIC = {
  subtitle: "Here’s where the program stands.",
};

export function AdminOverviewSkeleton() {
  return (
    <>
      <div>
        <h1 className="text-4xl">
          Welcome back, <Skeleton className="inline-block h-[0.75em] w-40 align-middle" />
        </h1>
        <p className="text-sm text-muted-foreground">{ADMIN_OVERVIEW_STATIC.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_LABELS.map((label) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">
                <Skeleton className="inline-block h-[0.8em] w-12 align-middle" />
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl">Recent classes</h2>
        <ul className="divide-y rounded-lg border">
          {Array.from({ length: RECENT_ROWS }, (_, index) => (
            <li key={index}>
              <div className="flex items-center justify-between gap-4 p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">
                    <Skeleton className="inline-block h-3.5 w-44 align-middle" />
                  </p>
                  <p className="text-muted-foreground">
                    <Skeleton className="inline-block h-3.5 w-32 align-middle" />
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
