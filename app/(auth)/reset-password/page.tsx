import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage(props: PageProps<"/reset-password">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-3xl">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">Your new password must be at least 8 characters.</p>
      </div>
      <Suspense>
        <ResetPasswordContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function ResetPasswordContent({
  searchParams,
}: {
  searchParams: PageProps<"/reset-password">["searchParams"];
}) {
  const params = await searchParams;
  return <ResetPasswordForm token={typeof params.token === "string" ? params.token : null} />;
}
