import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>
    </main>
  );
}
