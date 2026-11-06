"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CaretDownIcon, ListChecksIcon, LockIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { closeClass } from "@/app/(app)/admin/classes/actions";
import { closeSummary } from "@/components/classes/close-summary";
import { ClassFormDialog } from "@/components/classes/class-form-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
      toast.success(closeSummary(result, "Class closed. The QR code no longer works."));
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0">
      <Button size="lg" className="w-40 justify-start rounded-r-none px-3" render={<Link href={`/admin/classes/${data.id}/attendance`} />}>
        <ListChecksIcon data-icon="inline-start" />
        Take attendance
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="lg" aria-label="More class actions" className="rounded-l-none border-l-border/50 px-3" />}>
          <CaretDownIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[calc(var(--anchor-width)+10rem)]">
          <ClassFormDialog initial={data} trigger={<DropdownMenuItem><PencilSimpleIcon />Edit class</DropdownMenuItem>} />
          {data.status === "OPEN" ? <DropdownMenuItem disabled={pending} onClick={close}><LockIcon />Close class</DropdownMenuItem> : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
