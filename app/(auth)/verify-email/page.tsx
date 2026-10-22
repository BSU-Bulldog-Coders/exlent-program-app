import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";

export const metadata: Metadata = { title: "Verify your email" };

export default function VerifyEmailPage(props: PageProps<"/verify-email">) {
  return (
    <Suspense>
      <VerifyEmailContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function VerifyEmailContent({
  searchParams,
}: {
  searchParams: PageProps<"/verify-email">["searchParams"];
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-3xl">Check your inbox</h1>
      <p className="text-sm text-muted-foreground">
        {email ? (
          <>
            We sent a verification link to <span className="font-medium">{email}</span>.
          </>
        ) : (
          "We sent you a verification link."
        )}{" "}
        Click it to finish creating your account.
      </p>
      <ResendVerificationButton email={email} />
      <Link href="/login" className="text-sm underline underline-offset-4">
        Back to sign in
      </Link>
    </div>
  );
}
