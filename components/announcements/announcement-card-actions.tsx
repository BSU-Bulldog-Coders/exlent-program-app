"use client";

import { DotsThreeIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteAnnouncement } from "@/app/(app)/admin/announcements/actions";
import { AnnouncementFormDialog, type AnnouncementClassOption } from "@/components/announcements/announcement-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EditableAnnouncement = { id: string; title: string; body: string; classId: string | null };

export function AnnouncementCardActions({
  announcement,
  classes,
}: {
  announcement: EditableAnnouncement;
  classes: AnnouncementClassOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm("Delete this announcement? Unsent email deliveries will be cancelled.")) return;
    startTransition(async () => {
      const result = await deleteAnnouncement(announcement.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Announcement deleted.");
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" size="icon-sm" variant="ghost" aria-label="Announcement actions">
              <DotsThreeIcon weight="bold" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => setEditing(true)}>
            <PencilSimpleIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" disabled={pending} onClick={remove}>
            <TrashIcon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AnnouncementFormDialog
        classes={classes}
        defaultEmailRequested={false}
        initial={announcement}
        open={editing}
        onOpenChange={setEditing}
      />
    </>
  );
}
