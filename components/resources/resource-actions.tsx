"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteResource } from "@/app/(app)/resources/actions";
import { Button } from "@/components/ui/button";

export function ResourceActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <Button size="sm" variant="ghost" disabled={pending} onClick={() => {
    if (!window.confirm(`Delete “${title}”?`)) return;
    startTransition(async () => { const result = await deleteResource(id); if (!result.ok) { toast.error(result.error); return; } toast.success("Resource deleted."); router.refresh(); });
  }}><TrashIcon data-icon="inline-start" />Delete</Button>;
}
