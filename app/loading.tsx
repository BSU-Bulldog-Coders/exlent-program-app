import { Skeleton } from "@/components/ui/skeleton";

// "/" only redirects, so this is a neutral placeholder for that brief moment.
export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </main>
  );
}
