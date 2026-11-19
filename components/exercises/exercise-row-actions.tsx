"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DotsThreeIcon, TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ExerciseRowActions({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function deleteExercise() {
    setPending(true);
    try {
      const response = await fetch(`/api/exercises/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Could not delete exercise.");
      }
      setOpen(false);
      toast.success("Exercise deleted.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete exercise.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${title}`} />}>
          <DotsThreeIcon weight="bold" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem variant="destructive" onClick={() => setOpen(true)}>
            <TrashIcon /> Delete exercise
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={value => { if (!pending) setOpen(value); }}>
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>Delete exercise?</DialogTitle>
            <DialogDescription>
              Permanently delete {title} and its testcases, reports, student runs, and progress. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={pending} onClick={deleteExercise}>{pending ? "Deleting…" : "Delete exercise"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
