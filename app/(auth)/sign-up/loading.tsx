import { FieldSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-3xl">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll email you a link to verify your address.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <FieldGroup>
          <FieldSkeleton label="Full name" htmlFor="name" />
          <FieldSkeleton label="Email" htmlFor="email" />
          <FieldSkeleton label="Password" htmlFor="password" />
        </FieldGroup>
        <Button disabled>Create account</Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <span className="underline underline-offset-4">Sign in</span>
        </p>
      </div>
    </div>
  );
}
