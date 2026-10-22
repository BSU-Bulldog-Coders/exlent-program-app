"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { closeClass } from "@/app/(app)/admin/classes/actions";
import { Button } from "@/components/ui/button";

export function CloseClassButton({ classId }: { classId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await closeClass(classId);
          if (!result.ok) return void toast.error(result.error);
          toast.success("Class closed.");
          router.push(`/admin/classes/${classId}`);
        })
      }
    >
      <Lock data-icon="inline-start" />
      Close class
    </Button>
  );
}
