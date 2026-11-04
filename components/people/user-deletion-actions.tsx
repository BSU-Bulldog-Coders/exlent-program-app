"use client";

import { useState, useTransition } from "react";
import { ArrowCounterClockwiseIcon, DotsThreeIcon, KeyIcon, StarIcon, TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  permanentlyDeleteUser,
  scheduleDeletion,
  sendPasswordReset,
  undoDeletion,
} from "@/app/(app)/admin/people/actions";
import { ManagePointsDialog } from "@/components/people/manage-points-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DialogKind = "schedule" | "undo" | "delete-now" | null;

function ConfirmationDialog({
  kind,
  name,
  email,
  onOpenChange,
  onConfirm,
  pending,
}: {
  kind: DialogKind;
  name: string;
  email: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  const title = kind === "undo" ? "Undo account deletion?" : kind === "delete-now" ? "Delete account now?" : "Schedule account deletion?";
  const description = kind === "undo"
    ? `${name} can sign in again after choosing a new session.`
    : kind === "delete-now"
      ? `${name}'s account and authentication records will be permanently deleted immediately.`
      : `${name} (${email}) will be signed out immediately and permanently deleted after 30 days.`;
  const label = kind === "undo" ? "Undo deletion" : kind === "delete-now" ? "Delete now" : "Schedule deletion";

  return (
    <Dialog open={kind !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant={kind === "undo" ? "default" : "destructive"} onClick={onConfirm} disabled={pending}>
            {pending ? "Working…" : label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ActiveUserActions({ userId, name, email, deletionScheduled = false, score }: {
  userId: string;
  /** Passed for students only; shows the Manage points action. */
  score?: number;
  name: string;
  email: string;
  deletionScheduled?: boolean;
}) {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [pointsOpen, setPointsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function requestReset() {
    startTransition(async () => {
      const result = await sendPasswordReset(userId);
      if (!result.ok) toast.error(result.error);
      else if (result.active) toast.message(`A reset link for ${email} is already active.`);
      else toast.success(`Password reset link sent to ${email}.`);
    });
  }

  function confirmSchedule() {
    startTransition(async () => {
      const result = await scheduleDeletion(userId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${name}'s account is scheduled for deletion.`);
      setDialog(null);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="icon-sm" variant="ghost" disabled={pending} aria-label="User actions">
              <DotsThreeIcon weight="bold" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={requestReset} disabled={pending}>
            <KeyIcon /> Reset password
          </DropdownMenuItem>
          {score !== undefined ? (
            <DropdownMenuItem onClick={() => setPointsOpen(true)} disabled={pending}>
              <StarIcon /> Manage points
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={pending || deletionScheduled}
            onClick={() => setDialog("schedule")}
          >
            <TrashIcon /> {deletionScheduled ? "Deletion scheduled" : "Delete user"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmationDialog
        kind={dialog}
        name={name}
        email={email}
        onOpenChange={(open) => !open && setDialog(null)}
        onConfirm={confirmSchedule}
        pending={pending}
      />
      {score !== undefined ? (
        <ManagePointsDialog
          open={pointsOpen}
          onOpenChange={setPointsOpen}
          userId={userId}
          name={name}
          score={score}
        />
      ) : null}
    </>
  );
}

export function DeletedUserActions({ userId, name, email }: { userId: string; name: string; email: string }) {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [pending, startTransition] = useTransition();

  function confirmUndo() {
    startTransition(async () => {
      const result = await undoDeletion(userId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${name}'s deletion was undone.`);
      setDialog(null);
    });
  }

  function confirmDeleteNow() {
    startTransition(async () => {
      const result = await permanentlyDeleteUser(userId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${name}'s account was permanently deleted.`);
      setDialog(null);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="icon-sm" variant="ghost" disabled={pending} aria-label="User actions">
              <DotsThreeIcon weight="bold" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setDialog("undo")} disabled={pending}>
            <ArrowCounterClockwiseIcon /> Undo deletion
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete-now")} disabled={pending}>
            <TrashIcon /> Delete now
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmationDialog
        kind={dialog}
        name={name}
        email={email}
        onOpenChange={(open) => !open && setDialog(null)}
        onConfirm={dialog === "undo" ? confirmUndo : confirmDeleteNow}
        pending={pending}
      />
    </>
  );
}
