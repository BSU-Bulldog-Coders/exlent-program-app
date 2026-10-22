import { InlineSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";

export default function Loading() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-3xl">Check your inbox</h1>
      <p className="text-sm text-muted-foreground">
        We sent a verification link to <InlineSkeleton className="h-3.5 w-40" />. Click it to finish
        creating your account.
      </p>
      <Button variant="outline" disabled>
        Resend email
      </Button>
      <span className="text-sm underline underline-offset-4">Back to sign in</span>
    </div>
  );
}
