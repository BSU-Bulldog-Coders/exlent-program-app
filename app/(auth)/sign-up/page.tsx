import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getCurrentUser, safeCallbackPath } from "@/lib/dal";
import { findInviteByToken, type InviteStatus } from "@/lib/invites";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage(props: PageProps<"/sign-up">) {
  return (
    <Suspense>
      <SignUpContent searchParams={props.searchParams} />
    </Suspense>
  );
}

const INVITE_PROBLEMS: Record<Exclude<InviteStatus, "pending">, string> = {
  accepted: "This invitation has already been used. Try signing in instead.",
  revoked: "This invitation was revoked. Ask an admin to send you a new one.",
  expired: "This invitation has expired. Ask an admin to send you a new one.",
};

async function SignUpContent({
  searchParams,
}: {
  searchParams: PageProps<"/sign-up">["searchParams"];
}) {
  const params = await searchParams;
  const callbackURL = safeCallbackPath(
    typeof params.callbackURL === "string" ? params.callbackURL : undefined,
  );
  const inviteToken = typeof params.invite === "string" ? params.invite : undefined;

  if (await getCurrentUser()) redirect(callbackURL);

  if (inviteToken) {
    const found = await findInviteByToken(inviteToken);
    if (!found) return <Problem message="This invitation link is not valid." />;
    if (found.status !== "pending") {
      return <Problem message={INVITE_PROBLEMS[found.status]} />;
    }
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-3xl">Accept your invitation</h1>
          <p className="text-sm text-muted-foreground">
            Finish creating your account to join the program.
          </p>
        </div>
        <AcceptInviteForm token={inviteToken} email={found.invite.email} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <p className="text-sm text-muted-foreground">
          We&apos;ll email you a link to verify your address.
        </p>
        <p className="text-xs text-muted-foreground">
          By creating an account you agree to the <a href="/legal/terms" className="underline">Terms</a> and <a href="/legal/privacy" className="underline">Privacy Policy</a>.
        </p>      </div>
      <SignUpForm callbackURL={callbackURL} />
    </div>
  );
}

function Problem({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-4 text-center">
      <h1 className="text-3xl">Invitation unavailable</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link href="/login" className="text-sm underline underline-offset-4">
        Go to sign in
      </Link>
    </div>
  );
}
