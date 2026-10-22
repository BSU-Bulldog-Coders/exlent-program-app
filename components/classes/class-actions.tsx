"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Lock, Pencil, QrCode } from "lucide-react";
import { toast } from "sonner";
import { closeClass, openClass } from "@/app/(app)/admin/classes/actions";
import { ClassFormDialog } from "@/components/classes/class-form-dialog";
import { Button } from "@/components/ui/button";

type ClassData = {
  id: string;
  name: string;
  description: string | null;
  startsAt: string;
  status: "DRAFT" | "OPEN" | "CLOSED";
};

export function ClassActions({ data }: { data: ClassData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function showQr() {
    startTransition(async () => {
      const result = await openClass(data.id);
      if (!result.ok) return void toast.error(result.error);
      router.push(`/admin/classes/${data.id}/qr`);
    });
  }

  function close() {
    startTransition(async () => {
      const result = await closeClass(data.id);
      if (!result.ok) return void toast.error(result.error);
      toast.success("Class closed. The QR code no longer works.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={showQr} disabled={pending}>
        <QrCode data-icon="inline-start" />
        {data.status === "CLOSED" ? "Reopen and show QR" : "Show QR"}
      </Button>
      {data.status === "OPEN" ? (
        <Button variant="outline" onClick={close} disabled={pending}>
          <Lock data-icon="inline-start" />
          Close class
        </Button>
      ) : null}
      <ClassFormDialog
        initial={data}
        trigger={
          <Button variant="outline">
            <Pencil data-icon="inline-start" />
            Edit
          </Button>
        }
      />
    </div>
  );
}
