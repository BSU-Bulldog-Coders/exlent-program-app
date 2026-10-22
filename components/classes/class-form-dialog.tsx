"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createClass, updateClass } from "@/app/(app)/admin/classes/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * The picker only chooses a day. The time of day comes from the device clock at
 * submit time, so a class created today starts "now". When editing, an
 * unchanged day keeps the class's original start time.
 */
function startsAtFor(day: Date, original?: Date) {
  if (original && isSameLocalDay(day, original)) return original;
  const now = new Date();
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  );
}

type Initial = { id: string; name: string; description: string | null; startsAt: string };

export function ClassFormDialog({
  initial,
  trigger,
}: {
  initial?: Initial;
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(
    initial ? new Date(initial.startsAt) : new Date(),
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!date) {
      setError("Pick a date for the class.");
      return;
    }
    const startsAt = startsAtFor(date, initial ? new Date(initial.startsAt) : undefined);
    const input = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
      // Time and timezone are read from the admin's device.
      startsAt: startsAt.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    setError(null);

    startTransition(async () => {
      if (initial) {
        const result = await updateClass(initial.id, input);
        if (!result.ok) return setError(result.error);
        toast.success("Class updated.");
        setOpen(false);
        router.refresh();
      } else {
        const result = await createClass(input);
        if (!result.ok) return setError(result.error);
        toast.success("Class created.");
        setOpen(false);
        router.push(`/admin/classes/${result.id}`);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          // Start each time the dialog opens from the saved (or today's) date.
          setDate(initial ? new Date(initial.startsAt) : new Date());
          setError(null);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{initial ? "Edit class" : "New class"}</DialogTitle>
            <DialogDescription>
              {initial
                ? "Update the class details."
                : "Create a class, then show its QR code so students can check in."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="class-name">Name</FieldLabel>
              <Input
                id="class-name"
                name="name"
                defaultValue={initial?.name}
                placeholder="Week 1: Introduction"
                required
                maxLength={120}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="class-date">Date</FieldLabel>
              <DatePicker id="class-date" value={date} onChange={setDate} />
            </Field>
            <Field>
              <FieldLabel htmlFor="class-description">Description (optional)</FieldLabel>
              <Textarea
                id="class-description"
                name="description"
                defaultValue={initial?.description ?? ""}
                placeholder="Topics, links, or notes for this class"
                maxLength={2000}
              />
            </Field>
          </FieldGroup>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : initial ? "Save changes" : "Create class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
