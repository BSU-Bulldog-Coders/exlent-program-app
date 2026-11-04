import type { Metadata } from "next";
import { Suspense } from "react";
import { ResourceList } from "@/components/resources/resource-list";
import { ResourceListSkeleton } from "@/components/resources/resource-list-skeleton";

export const metadata: Metadata = { title: "Resources" };

export default function ResourcesPage() {
  return (
    <Suspense fallback={<ResourceListSkeleton />}>
        <ResourceList />
    </Suspense>
  );
}
