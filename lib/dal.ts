import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type Role = "ADMIN" | "STUDENT";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, role } = session.user as typeof session.user & { role?: string };
  // Session rows are removed when deletion is scheduled. This extra check
  // also closes a sign-in race that began just before that revocation.
  const activeUser = await prisma.user.findFirst({
    where: { id, deletionScheduledAt: null },
    select: { id: true },
  });
  if (!activeUser) return null;
  return { id, name, email, role: role === "ADMIN" ? "ADMIN" : "STUDENT" };
});

/** Redirects to /login (preserving where the user was headed) when signed out. */
export async function requireUser(returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const query = returnTo ? `?callbackURL=${encodeURIComponent(returnTo)}` : "";
    redirect(`/login${query}`);
  }
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

export function homePathFor(role: Role) {
  void role;
  return "/";
}

/** Only allow same-origin relative redirects (blocks open redirects). */
export function safeCallbackPath(value: string | undefined | null, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
