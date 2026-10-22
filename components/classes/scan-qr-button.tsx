"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { QrCodeIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { openClass } from "@/app/(app)/admin/classes/actions";
import { Button } from "@/components/ui/button";

/** Opens the class for check-in (if it was closed) and goes to the QR code page. */
export function ScanQrButton({ classId }: { classId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await openClass(classId);
          if (!result.ok) return void toast.error(result.error);
          router.push(`/admin/classes/${classId}/qr`);
        })
      }
    >
      <QrCodeIcon data-icon="inline-start" />
      Scan QR code
    </Button>
  );
}
