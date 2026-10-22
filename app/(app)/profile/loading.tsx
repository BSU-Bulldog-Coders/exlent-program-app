import { FieldSkeleton, InlineSkeleton, StatCardSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

export default function Loading() {
  return (
    <>
      <div>
        <h1 className="text-4xl">Profile</h1>
        <p className="text-sm text-muted-foreground">
          <InlineSkeleton className="h-3.5 w-52" />
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCardSkeleton label="Classes attended" />
        <StatCardSkeleton label="Attendance rate" caption="Since you joined" />
      </div>
      <div className="flex max-w-sm flex-col gap-4">
        <FieldGroup>
          <FieldSkeleton label="Email" htmlFor="profile-email" />
          <FieldSkeleton label="Name" htmlFor="profile-name" />
        </FieldGroup>
        <Button className="w-fit" disabled>
          Save
        </Button>
      </div>
    </>
  );
}
