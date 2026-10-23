import { FieldSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-3xl">Reset your password</h1>
        <p className="text-sm text-muted-foreground">We&apos;ll email you a secure reset link.</p>
      </div>
      <div className="flex flex-col gap-6">
        <FieldGroup>
          <FieldSkeleton label="Email" htmlFor="email" />
        </FieldGroup>
        <Button disabled>Send reset link</Button>
        <p className="text-center text-sm underline underline-offset-4">Back to sign in</p>
      </div>
    </div>
  );
}
