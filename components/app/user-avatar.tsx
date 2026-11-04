"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarInitials, resolveAvatarUrl, type AvatarUser } from "@/lib/avatar";

/** One avatar everywhere: a user's photo, or their DiceBear adventurer. */
export function UserAvatar({
  user,
  size = "default",
  className,
}: {
  user: AvatarUser;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      <AvatarImage src={resolveAvatarUrl(user)} alt="" />
      <AvatarFallback>{avatarInitials(user.name)}</AvatarFallback>
    </Avatar>
  );
}
