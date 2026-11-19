import { PlusIcon } from "@phosphor-icons/react/ssr";
import { TableSkeleton } from "@/components/app/skeletons";
import { ClassContentTabs } from "@/components/classes/class-content-tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ClassContentSkeleton({ canManage = false }: { canManage?: boolean }) {
  return <ClassContentTabs resources={<section className="flex flex-col gap-4">{canManage && <div className="flex justify-end"><Button size="sm" disabled><PlusIcon data-icon="inline-start" />Upload resource</Button></div>}<Skeleton className="h-28 w-full" /></section>} exercises={<TableSkeleton columns={[{ label: "Title", width: "w-40" }, { label: "Classes", width: "w-32" }, { label: "Status", width: "w-20", pill: true }, ...(canManage ? [{ label: "", width: "w-7", align: "right" as const }] : [])]} />} />;
}
