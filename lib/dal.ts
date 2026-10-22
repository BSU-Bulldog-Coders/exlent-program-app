import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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
  if (user.role !== "ADMIN") redirect("/classes");
  return user;
}

export function homePathFor(role: Role) {
  return role === "ADMIN" ? "/admin" : "/classes";
}

/** Only allow same-origin relative redirects (blocks open redirects). */
export function safeCallbackPath(value: string | undefined | null, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
