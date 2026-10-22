import { QrCodeIcon } from "@phosphor-icons/react/ssr";
import { BackLinkSkeleton, InlineSkeleton, TableSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";

export default function Loading() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <BackLinkSkeleton label="Class details" />
          <h1 className="text-4xl">
            <InlineSkeleton className="h-[0.75em] w-56" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Take attendance · <InlineSkeleton className="h-3.5 w-36" />
          </p>
        </div>
        <Button disabled>
          <QrCodeIcon data-icon="inline-start" />
          Scan QR code
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          <InlineSkeleton className="h-3.5 w-28" />
        </p>
        <TableSkeleton
          columns={[
            { label: "Student", width: "w-40" },
            { label: "Attendance", width: "w-44", height: "h-7", align: "right" },
          ]}
        />
      </div>
    </>
  );
}
