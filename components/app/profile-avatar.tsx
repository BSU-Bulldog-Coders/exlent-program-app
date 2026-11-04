"use client";

import { PencilSimpleIcon } from "@phosphor-icons/react";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { avatarInitials, resolveAvatarUrl, type AvatarUser } from "@/lib/avatar";
import { validateAvatarFile } from "@/lib/profile-image";

/** Uploads the file as the `image` form field and resolves to the stored public URL. */
export async function uploadAvatar(file: File): Promise<string> {
  const body = new FormData();
  body.set("image", file);
  const response = await fetch("/api/profile/image", { method: "PATCH", body });
  const result = (await response.json().catch(() => ({}))) as { image?: string; error?: string };
  if (!response.ok || !result.image) throw new Error(result.error ?? "Could not upload the image.");
  return result.image;
}

/** The profile page avatar: click it (or its edit icon) to pick a new photo. */
export function ProfileAvatar({
  user,
  upload = uploadAvatar,
}: {
  user: AvatarUser;
  upload?: (file: File) => Promise<string>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(user.image ?? null);
  // Shows the picked file at once; dropped (back to `saved`) when the transition ends.
  const [image, setOptimisticImage] = useOptimistic(saved);
  const [, startTransition] = useTransition();
  const src = resolveAvatarUrl({ ...user, image });

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const checked = validateAvatarFile(file);
    if ("error" in checked) {
      toast.error(checked.error);
      return;
    }
    const preview = URL.createObjectURL(file);
    startTransition(async () => {
      setOptimisticImage(preview);
      try {
        setSaved(await upload(file));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not upload the image.");
      } finally {
        URL.revokeObjectURL(preview);
      }
    });
  }

  return (
    <div className="relative size-20 shrink-0">
      <button
        type="button"
        aria-label="Change avatar"
        onClick={() => inputRef.current?.click()}
        className="block size-full rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <Avatar className="size-full" data-src={src}>
          <AvatarImage src={src} alt="" />
          <AvatarFallback className="text-xl">{avatarInitials(user.name)}</AvatarFallback>
        </Avatar>
        <span
          aria-hidden
          data-slot="avatar-edit"
          className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background"
        >
          <PencilSimpleIcon className="size-3.5" />
        </span>
      </button>
      <Input
        ref={inputRef}
        type="file"
        name="image"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-label="Avatar image"
        onChange={onChange}
      />
    </div>
  );
}
