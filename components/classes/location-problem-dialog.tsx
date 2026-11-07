"use client";

import { MapPinIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PROBLEM_COPY, type LocationProblem } from "@/components/classes/location";

/** Shown when the browser can't give us a location. "Try again" asks for it again, which re-shows the permission prompt when the browser allows it. */
export function LocationProblemDialog({
  problem,
  pending,
  onRetry,
  onClose,
}: {
  problem: LocationProblem | null;
  pending: boolean;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={problem !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPinIcon /> {problem ? PROBLEM_COPY[problem].title : ""}
          </DialogTitle>
          <DialogDescription>{problem ? PROBLEM_COPY[problem].body : ""}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending} onClick={onRetry}>
            {pending ? "Checking…" : "Try again"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
