import { TableSkeleton } from "@/components/app/skeletons";

export default function Loading() {
  return (
    <>
      <div>
        <h1 className="text-4xl">My classes</h1>
        <p className="text-sm text-muted-foreground">
          Classes you&apos;ve attended. Scan the QR code in class to check in.
        </p>
      </div>
      <TableSkeleton
        columns={[
          { label: "Class", width: "w-48" },
          { label: "Date", width: "w-40" },
          { label: "Checked in", width: "w-40" },
        ]}
      />
    </>
  );
}
