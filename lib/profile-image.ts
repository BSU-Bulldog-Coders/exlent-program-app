/** Shared validation for an uploaded profile image.

 * Used by PATCH /api/profile/image and by the ProfileAvatar component, so the
 * browser rejects exactly what the server would reject.
 */

export const MAX_AVATAR_SIZE = 10 * 1024 * 1024;

// SVG is deliberately absent: it can carry script.
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export type AvatarFileResult =
  | { file: File; extension: string }
  | { error: string; status: 400 | 413 | 415 };

export function validateAvatarFile(file: unknown): AvatarFileResult {
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Attach an image file in the \"image\" field.", status: 400 };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Only image files can be used as an avatar.", status: 415 };
  }
  const extension = IMAGE_EXTENSIONS[file.type];
  if (!extension) {
    return { error: "Use a PNG, JPEG, WebP, GIF or AVIF image.", status: 415 };
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return { error: "Avatar images can be at most 10 MB.", status: 413 };
  }
  return { file, extension };
}
