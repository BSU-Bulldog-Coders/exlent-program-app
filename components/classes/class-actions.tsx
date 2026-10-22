"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ListChecksIcon, LockIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { closeClass } from "@/app/(app)/admin/classes/actions";
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
      <Button render={<Link href={`/admin/classes/${data.id}/attendance`} />}>
        <ListChecksIcon data-icon="inline-start" />
        Take attendance
      </Button>
      {data.status === "OPEN" ? (
        <Button variant="outline" onClick={close} disabled={pending}>
          <LockIcon data-icon="inline-start" />
          Close class
        </Button>
      ) : null}
      <ClassFormDialog
        initial={data}
        trigger={
          <Button variant="outline">
            <PencilSimpleIcon data-icon="inline-start" />
            Edit
          </Button>
        }
      />
    </div>
  );
}
