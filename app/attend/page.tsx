import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckIn } from "@/components/classes/check-in";
import { Button } from "@/components/ui/button";
import { getCurrentUser, homePathFor } from "@/lib/dal";

export const metadata: Metadata = { title: "Check in" };

export default function AttendPage(props: PageProps<"/attend">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Loading…</p>}>
          <AttendContent searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function AttendContent({
  searchParams,
}: {
  searchParams: PageProps<"/attend">["searchParams"];
}) {
  const params = await searchParams;
  const token = typeof params.t === "string" ? params.t : "";

  if (!token) {
    return (
      <Message
        title="No QR code found"
        body="Scan the QR code your admin is showing in class."
      />
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    // Sign in, then come straight back here: the check-in happens automatically.
    redirect(`/login?callbackURL=${encodeURIComponent(`/attend?t=${token}`)}`);
  }
  if (user.role !== "STUDENT") {
    return (
      <Message
        title="Admins don't check in"
        body="Sign in with a student account to record attendance."
        href={homePathFor(user.role)}
        cta="Back to dashboard"
      />
    );
  }

  return <CheckIn token={token} />;
}

function Message({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h1 className="text-3xl">{title}</h1>
      <p className="text-sm text-muted-foreground">{body}</p>
      {href && cta ? (
        <Button variant="outline" render={<Link href={href} />}>
          {cta}
        </Button>
      ) : null}
    </div>
  );
}
