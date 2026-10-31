import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser, safeCallbackPath } from "@/lib/dal";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <p className="text-sm text-muted-foreground">Use your program account.</p>
        <p className="text-xs text-muted-foreground mt-1">
          By signing in you agree to the <a href="/legal/terms" className="underline">Terms</a> and <a href="/legal/privacy" className="underline">Privacy Policy</a>.
        </p>      <Suspense>
        <LoginContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function LoginContent({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const callbackURL = safeCallbackPath(
    typeof params.callbackURL === "string" ? params.callbackURL : undefined,
  );
  if (await getCurrentUser()) redirect(callbackURL);
  return <LoginForm callbackURL={callbackURL} passwordReset={params.passwordReset === "1"} />;
}
