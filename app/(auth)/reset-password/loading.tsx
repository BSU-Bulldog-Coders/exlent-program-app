import { FieldSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-3xl">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">Your new password must be at least 8 characters.</p>
      </div>
      <div className="flex flex-col gap-6">
        <FieldGroup>
          <FieldSkeleton label="New password" htmlFor="new-password" />
          <FieldSkeleton label="Confirm new password" htmlFor="confirmation" />
        </FieldGroup>
        <Button disabled>Reset password</Button>
        <p className="text-center text-sm underline underline-offset-4">Request a new link</p>
      </div>
    </div>
  );
}
