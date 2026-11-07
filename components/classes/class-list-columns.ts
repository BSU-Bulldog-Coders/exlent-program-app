import type { SkeletonColumn } from "@/components/app/skeletons";

// Shared by each classes page, its Suspense fallback and its loading.tsx so the skeleton can't drift from the table.
export const ADMIN_CLASS_COLUMNS: SkeletonColumn[] = [
  { label: "Name", width: "w-48" },
  { label: "Date", width: "w-40" },
  { label: "Status", width: "w-16", pill: true },
  { label: "Checked in", width: "w-8", align: "right" },
];

export const STUDENT_CLASS_COLUMNS: SkeletonColumn[] = [
  { label: "Class", width: "w-48" },
  { label: "Date", width: "w-40" },
  { label: "Status", width: "w-16", pill: true },
  { label: "Checked in", width: "w-40" },
];
