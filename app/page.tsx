import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser, homePathFor } from "@/lib/dal";

export default function Home() {
  return (
    <Suspense>
      <HomeRedirect />
    </Suspense>
  );
}

async function HomeRedirect(): Promise<never> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(homePathFor(user.role));
}
