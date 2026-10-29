import { ResourceListSkeleton } from "@/components/resources/resource-list-skeleton";

export default function Loading() {
  return <div className="flex w-full flex-col gap-6"><ResourceListSkeleton /></div>;
}
