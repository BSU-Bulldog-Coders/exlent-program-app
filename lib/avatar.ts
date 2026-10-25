/** Shared avatar resolution for every surface that shows a user.

 * Priority:
 * 1. The user's `image` (the existing User column, managed from the
 *    profile page or PATCH /api/profile/image).
 * 2. A generated DiceBear adventurer avatar, seeded deterministically from
 *    the user's id (or name when no id is available) so the same person
 *    always gets the same avatar. The seed is an opaque id, never an email.
 */

export type AvatarUser = {
  id?: string | null;
  name?: string | null;
  image?: string | null;
};

const DICEBEAR_BASE = "https://api.dicebear.com/9.x/adventurer/svg";

function dicebearUrl(seed: string): string {
  return `${DICEBEAR_BASE}?seed=${encodeURIComponent(seed)}`;
}

/** The image URL to render for a user: their photo, or a DiceBear fallback. */
export function resolveAvatarUrl(user: AvatarUser): string {
  const image = user.image?.trim();
  if (image) return image;
  return dicebearUrl(user.id?.trim() || user.name?.trim() || "student");
}

/** Initials for the avatar fallback (shown if even the generated image fails). */
export function avatarInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
