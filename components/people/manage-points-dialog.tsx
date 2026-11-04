"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addPoints, removePoints, type PointsResult } from "@/app/(app)/admin/people/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Kind = "add" | "remove";

export function ManagePointsDialog({ open, onOpenChange, userId, name, score }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  name: string;
  score: number;
}) {
  const [current, setCurrent] = useState(score);
  const [amounts, setAmounts] = useState<Record<Kind, string>>({ add: "", remove: "" });
  // One key per intended change: a retry or double click re-sends the same key
  // (applied once); it is replaced only after success or when the amount edits.
  const [keys, setKeys] = useState<Record<Kind, string>>(() => ({
    add: crypto.randomUUID(),
    remove: crypto.randomUUID(),
  }));
  const [pending, startTransition] = useTransition();

  function setAmount(kind: Kind, value: string) {
    setAmounts((prev) => ({ ...prev, [kind]: value }));
    setKeys((prev) => ({ ...prev, [kind]: crypto.randomUUID() }));
  }

  function submit(kind: Kind) {
    if (pending) return;
    const amount = Number(amounts[kind]);
    if (!Number.isInteger(amount) || amount < 1) {
      toast.error("Enter a whole number of points, at least 1.");
      return;
    }
    startTransition(async () => {
      const result: PointsResult = await (kind === "add" ? addPoints : removePoints)(userId, amount, keys[kind]);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCurrent(result.score);
      setAmounts((prev) => ({ ...prev, [kind]: "" }));
      setKeys((prev) => ({ ...prev, [kind]: crypto.randomUUID() }));
      toast.success(`${name} now has ${result.score} points.`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage points</DialogTitle>
          <DialogDescription>
            {name} has <span className="font-medium text-foreground">{current}</span> points.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {(["add", "remove"] as const).map((kind) => (
            <form
              key={kind}
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                submit(kind);
              }}
            >
              <div className="grid flex-1 gap-1.5">
                <Label htmlFor={`${kind}-points-${userId}`}>{kind === "add" ? "Add points" : "Remove points"}</Label>
                <Input
                  id={`${kind}-points-${userId}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={32767}
                  step={1}
                  value={amounts[kind]}
                  onChange={(event) => setAmount(kind, event.target.value)}
                  disabled={pending}
                />
              </div>
              <Button type="submit" variant={kind === "add" ? "default" : "outline"} disabled={pending || !amounts[kind]}>
                {kind === "add" ? "Add" : "Remove"}
              </Button>
            </form>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
