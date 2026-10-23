import { FieldSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-3xl">Sign in</h1>
        <p className="text-sm text-muted-foreground">Use your program account.</p>
      </div>
      <div className="flex flex-col gap-6">
        <FieldGroup>
          <FieldSkeleton label="Email" htmlFor="email" />
          <FieldSkeleton label="Password" htmlFor="password" />
        </FieldGroup>
        <Button disabled>Sign in</Button>
        <p className="text-center text-sm underline underline-offset-4">Forgot password?</p>
        <p className="text-center text-sm text-muted-foreground">
          New here? <span className="underline underline-offset-4">Create an account</span>
        </p>
      </div>
    </div>
  );
}
