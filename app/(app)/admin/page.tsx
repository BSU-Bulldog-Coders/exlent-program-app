import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ADMIN_OVERVIEW_STATIC, AdminOverviewSkeleton } from "@/components/admin/admin-overview-skeleton";
import { ClassStatusBadge } from "@/components/classes/class-status-badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Overview" };

export default function AdminOverviewPage() {
  // The session and database reads happen at request time, so they stream in
  // behind this boundary while the skeleton holds the page's layout.
  return (
    <Suspense fallback={<AdminOverviewSkeleton />}>
      <AdminOverviewContent />
    </Suspense>
  );
}

async function AdminOverviewContent() {
  const admin = await requireAdmin();
  const [students, classCount, openClasses, pendingInvites, recent] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.class.count(),
    prisma.class.findMany({ where: { status: "OPEN" }, select: { id: true, name: true } }),
    prisma.invite.count({
      where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    }),
    prisma.class.findMany({
      orderBy: { startsAt: "desc" },
      take: 5,
      include: { _count: { select: { attendances: true } } },
    }),
  ]);

  const stats = [
    { label: "Students", value: students, href: "/admin/people" },
    { label: "Classes", value: classCount, href: "/admin/classes" },
    { label: "Open now", value: openClasses.length, href: "/admin/classes" },
    { label: "Pending invites", value: pendingInvites, href: "/admin/people" },
  ];

  return (
    <>
      <div>
        <h1 className="text-4xl">Welcome back, {admin.name}</h1>
        <p className="text-sm text-muted-foreground">{ADMIN_OVERVIEW_STATIC.subtitle}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      {openClasses.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl">Taking attendance now</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {openClasses.map((item) => (
              <li key={item.id}>
                <Link href={`/admin/classes/${item.id}/qr`} className="underline underline-offset-4">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl">Recent classes</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No classes yet.{" "}
            <Link href="/admin/classes" className="underline underline-offset-4">
              Create the first one
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {recent.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/classes/${item.id}`}
                  className="flex items-center justify-between gap-4 p-3 text-sm hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-muted-foreground">
                      {formatDateTime(item.startsAt, item.timezone)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-muted-foreground">{item._count.attendances} present</span>
                    <ClassStatusBadge status={item.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
