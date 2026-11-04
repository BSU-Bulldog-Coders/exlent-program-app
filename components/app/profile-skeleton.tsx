import { FieldSkeleton, InlineSkeleton, StatCardSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <>
      <div className="flex items-center gap-4">
        <Skeleton className="size-20 rounded-full" />
        <div>
          <h1 className="text-4xl">Profile</h1>
          <p className="text-sm text-muted-foreground">
            <InlineSkeleton className="h-3.5 w-52" />
          </p>
        </div>
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
      <div className="flex max-w-sm flex-col gap-4">
        <div>
          <h2 className="text-xl">Password</h2>
          <p className="text-sm text-muted-foreground">Changing it signs out your other devices.</p>
        </div>
        <FieldGroup>
          <FieldSkeleton label="Current password" htmlFor="current-password" />
          <FieldSkeleton label="New password" htmlFor="profile-new-password" />
          <FieldSkeleton label="Confirm new password" htmlFor="profile-password-confirmation" />
        </FieldGroup>
        <Button className="w-fit" disabled>
          Change password
        </Button>
      </div>
    </>
  );
}
