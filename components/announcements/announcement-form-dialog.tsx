"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createAnnouncement, updateAnnouncement } from "@/app/(app)/admin/announcements/actions";
import { AnnouncementClassPicker } from "@/components/announcements/announcement-class-picker";
import { MarkdownComposer } from "@/components/announcements/markdown-composer";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export type AnnouncementClassOption = { id: string; name: string };
export type AnnouncementResourceOption = { id: string; title: string };
type InitialAnnouncement = { id: string; title: string; body: string; classId: string | null; resources?: AnnouncementResourceOption[] };

export function AnnouncementFormDialog({
  classes,
  resources = [],
  defaultEmailRequested,
  initial,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  classes: AnnouncementClassOption[];
  resources?: AnnouncementResourceOption[];
  defaultEmailRequested: boolean;
  initial?: InitialAnnouncement;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [classId, setClassId] = useState(initial?.classId ?? "");
  const [emailRequested, setEmailRequested] = useState(defaultEmailRequested);
  const [resourceIds, setResourceIds] = useState<string[]>(initial?.resources?.map((resource) => resource.id) ?? []);
  const open = controlledOpen ?? uncontrolledOpen;

  function reset() {
    setTitle(initial?.title ?? "");
    setBody(initial?.body ?? "");
    setClassId(initial?.classId ?? "");
    setEmailRequested(initial ? false : defaultEmailRequested);
    setResourceIds(initial?.resources?.map((resource) => resource.id) ?? []);
    setError(null);
  }

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
    if (next) reset();
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const input = { title, body, classId: classId || null, emailRequested, resourceIds };
      if (initial) {
        const result = await updateAnnouncement(initial.id, input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        toast.success("Announcement updated. Email was not resent.");
      } else {
        const result = await createAnnouncement(input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (result.recipients > 0) {
        toast.success(`Announcement published. ${result.recipients} recipient email(s) queued.`);
        } else {
          toast.success("Announcement published.");
        }
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="block max-h-[calc(100svh-2rem)] overflow-hidden p-0 sm:max-w-3xl">
        <form onSubmit={submit} className="flex max-h-[calc(100svh-2rem)] min-h-0 flex-col">
          <DialogHeader className="shrink-0 px-6 pt-6 pr-14 pb-4">
            <DialogTitle>{initial ? "Edit announcement" : "New announcement"}</DialogTitle>
            <DialogDescription>
              {initial
                ? "Changes appear on Home immediately. Existing recipients are not emailed again."
                : "Publish an update to the shared Home feed."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <Field>
              <FieldLabel htmlFor="announcement-title">Title</FieldLabel>
              <Input
                id="announcement-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Program update"
                required
                maxLength={160}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="announcement-class">Class (optional)</FieldLabel>
              <AnnouncementClassPicker
                id="announcement-class"
                classes={classes}
                value={classId}
                onValueChange={setClassId}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="announcement-body">Message</FieldLabel>
              <MarkdownComposer value={body} onChange={setBody} />
            </Field>
            <Field>
              <FieldLabel htmlFor="announcement-resources">Resources (optional)</FieldLabel>
              <select id="announcement-resources" multiple value={resourceIds} onChange={(event) => setResourceIds(Array.from(event.currentTarget.selectedOptions, (option) => option.value))} className="min-h-24 w-full rounded-lg border bg-transparent p-2 text-sm">
                {resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.title}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">Choose existing resources to display below this announcement.</p>
            </Field>
            {!initial ? (
              <Field orientation="horizontal" className="items-center justify-between rounded-lg border p-3">
                <div className="grid gap-1">
                  <FieldLabel htmlFor="announcement-email">Send email notification</FieldLabel>
                  <p className="text-sm text-muted-foreground">
                    Send this announcement to everyone with a verified email address. This choice is saved as your default.
                  </p>
                </div>
                <Switch
                  id="announcement-email"
                  checked={emailRequested}
                  onCheckedChange={setEmailRequested}
                />
              </Field>
            ) : null}
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          </FieldGroup>
          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none px-6 py-4">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : initial ? "Save changes" : "Publish announcement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
