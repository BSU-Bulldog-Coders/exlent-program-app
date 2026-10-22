"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { UsersIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { setAttendance } from "@/app/(app)/admin/classes/actions";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const POLL_MS = 5000;

type Student = { id: string; name: string };

/**
 * Every student with Present / Absent buttons. Absent means no check-in, so the
 * row shows Absent until the student is marked present, by the admin here or by
 * scanning the QR code (picked up by polling while the class is open).
 */
export function AttendanceRoster({
  classId,
  students,
  initialPresentIds,
  live,
}: {
  classId: string;
  students: Student[];
  initialPresentIds: string[];
  live: boolean;
}) {
  const [present, setPresent] = useState(() => new Set(initialPresentIds));
  const inFlight = useRef(0);

  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/classes/${classId}/attendees`, { cache: "no-store" });
        if (!response.ok || cancelled || inFlight.current > 0) return;
        const data: { attendees: { userId: string }[] } = await response.json();
        if (inFlight.current === 0) setPresent(new Set(data.attendees.map((a) => a.userId)));
      } catch {
        // Keep the last known state and retry on the next tick.
      }
    }
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [classId, live]);

  async function mark(userId: string, value: boolean) {
    if (present.has(userId) === value) return;
    const update = (next: boolean) =>
      setPresent((current) => {
        const copy = new Set(current);
        if (next) copy.add(userId);
        else copy.delete(userId);
        return copy;
      });

    update(value);
    inFlight.current += 1;
    try {
      const result = await setAttendance(classId, userId, value);
      if (!result.ok) {
        update(!value);
        toast.error(result.error);
      }
    } catch {
      update(!value);
      toast.error("Couldn't save that change. Try again.");
    } finally {
      inFlight.current -= 1;
    }
  }

  if (students.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyTitle>No students yet</EmptyTitle>
          <EmptyDescription>Invite students to the program to take attendance.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" render={<Link href="/admin/people" />}>
            Go to People
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {present.size} of {students.length} present
      </p>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead className="text-right">Attendance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => {
              const isPresent = present.has(student.id);
              return (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant={isPresent ? "default" : "outline"}
                        aria-pressed={isPresent}
                        onClick={() => mark(student.id, true)}
                      >
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={isPresent ? "outline" : "destructive"}
                        aria-pressed={!isPresent}
                        onClick={() => mark(student.id, false)}
                      >
                        Absent
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
