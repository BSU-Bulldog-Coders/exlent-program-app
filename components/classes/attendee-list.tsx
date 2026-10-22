"use client";

import { useEffect, useState } from "react";
import { UserCheckIcon, UsersIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTime } from "@/lib/format";

export type AttendanceData = {
  attendees: { userId: string; name: string; email: string; checkedInAt: string }[];
  absent: { userId: string; name: string; email: string }[];
};

const POLL_MS = 5000;

/** Live attendee list: server-rendered first, then refreshed every few seconds. */
export function AttendeeList({
  classId,
  timezone,
  initial,
  showAbsent,
  live,
  bare = false,
}: {
  classId: string;
  timezone: string;
  initial: AttendanceData;
  showAbsent: boolean;
  live: boolean;
  /** Full-width list with no card container; shows the shadcn Empty state when no one has checked in. */
  bare?: boolean;
}) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/classes/${classId}/attendees`, { cache: "no-store" });
        if (response.ok && !cancelled) setData(await response.json());
      } catch {
        // Transient network error: keep showing the last data and retry.
      }
    }
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [classId, live]);

  if (bare) {
    return (
      <section className="flex w-full min-w-0 flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl">Checked in</h2>
          <Badge variant="secondary">{data.attendees.length}</Badge>
        </div>
        {data.attendees.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>No one has checked in yet</EmptyTitle>
              <EmptyDescription>
                Students appear here as soon as they scan the code. This list updates automatically.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y">
            {data.attendees.map((person) => (
              <li key={person.userId} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{person.name}</p>
                  <p className="truncate text-muted-foreground">{person.email}</p>
                </div>
                <span className="shrink-0 text-muted-foreground">
                  {formatTime(person.checkedInAt, timezone)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <Tabs defaultValue="checked-in" className="gap-4">
      <TabsList>
        <TabsTrigger value="checked-in">
          Checked in
          <Badge variant="outline" className="h-5 min-w-5 px-1.5 text-xs">
            {data.attendees.length}
          </Badge>
        </TabsTrigger>
        {showAbsent ? (
          <TabsTrigger value="not-checked-in">
            Not checked in
            <Badge variant="outline" className="h-5 min-w-5 px-1.5 text-xs">
              {data.absent.length}
            </Badge>
          </TabsTrigger>
        ) : null}
      </TabsList>

      <TabsContent value="checked-in">
        {data.attendees.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>No one has checked in yet</EmptyTitle>
              <EmptyDescription>
                {live
                  ? "Students appear here as soon as they scan the code."
                  : "No students checked in to this class."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Checked in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.attendees.map((person) => (
                  <TableRow key={person.userId}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.email}</TableCell>
                    <TableCell className="text-right">
                      {formatTime(person.checkedInAt, timezone)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {showAbsent ? (
        <TabsContent value="not-checked-in">
          {data.absent.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserCheckIcon />
                </EmptyMedia>
                <EmptyTitle>Everyone is checked in</EmptyTitle>
                <EmptyDescription>No students are missing from this class.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.absent.map((person) => (
                    <TableRow key={person.userId}>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell>{person.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
