/** Shared validation for a user-managed profile image URL.

 * Used by both the profile server action and PATCH /api/profile/image so
 * the two ways of updating the image accept exactly the same values.
 * A blank value clears the image (back to the DiceBear fallback).
 */

export type ProfileImageResult = string | null | { error: string };

export function parseProfileImageUrl(value: unknown): ProfileImageResult {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return { error: "Enter a valid profile image URL, or leave it blank." };
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 500) return { error: "Profile image URL is too long." };
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { error: "Enter a valid profile image URL, or leave it blank." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { error: "Profile image URL must start with http:// or https://." };
  }
  return trimmed;
}
