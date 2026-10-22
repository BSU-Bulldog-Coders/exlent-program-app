import { PlusIcon } from "@phosphor-icons/react/ssr";
import { TableSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";

export default function Loading() {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl">Classes</h1>
          <p className="text-sm text-muted-foreground">
            Create a class, show its QR code, and track who attends.
          </p>
        </div>
        <Button disabled>
          <PlusIcon data-icon="inline-start" />
          New
        </Button>
      </div>
      <TableSkeleton
        columns={[
          { label: "Name", width: "w-48" },
          { label: "Date", width: "w-40" },
          { label: "Status", width: "w-16", pill: true },
          { label: "Checked in", width: "w-8", align: "right" },
        ]}
      />
    </>
  );
}
