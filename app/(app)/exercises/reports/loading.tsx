import { BackLinkSkeleton, TableSkeleton } from "@/components/app/skeletons";
export function ReportsSkeleton() { return <TableSkeleton columns={[{ label: "Exercise", width: "w-32" }, { label: "Student", width: "w-24" }, { label: "Report", width: "w-48" }, { label: "Status", width: "w-20", pill: true }]} />; }
export default function Loading() { return <><BackLinkSkeleton label="Exercises" /><div><h1 className="text-4xl">Testcase reports</h1><p className="text-sm text-muted-foreground">Review reports submitted by students.</p></div><ReportsSkeleton /></>; }
