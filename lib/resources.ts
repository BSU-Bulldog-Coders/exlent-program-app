import "server-only";
import { z } from "zod";
import { MAX_RESOURCE_SIZE } from "@/lib/s3";

const officeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/pdf",
]);
const allowedExtensions = new Set(["docx", "pptx", "xlsx", "pdf"]);

export function fileExtension(name: string) {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim());
  return match?.[1]?.toLowerCase() ?? null;
}

export function isAllowedResourceFile(name: string, contentType: string, size: number) {
  const extension = fileExtension(name);
  if (!extension || size <= 0 || size > MAX_RESOURCE_SIZE) return false;
  if (contentType.startsWith("image/") || contentType.startsWith("video/") || contentType.startsWith("audio/")) return true;
  return allowedExtensions.has(extension) && officeTypes.has(contentType);
}

export function normalizeYouTubeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    let id = host === "youtu.be" ? url.pathname.slice(1).split("/")[0] : url.searchParams.get("v");
    if (host === "youtube.com" && url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2];
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    if (host !== "youtube.com" && host !== "youtu.be") return null;
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return null;
  }
}

export function normalizeResourceLink(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return normalizeYouTubeUrl(value) ?? url.toString();
  } catch {
    return null;
  }
}

export function isYouTubeEmbedUrl(value: string | null) {
  return Boolean(value?.startsWith("https://www.youtube.com/embed/"));
}

export const resourceDetailsSchema = z.object({
  title: z.string().trim().min(1, "Enter a resource title.").max(160),
  description: z.string().trim().max(2_000).optional(),
  classId: z.string().trim().min(1).max(128).nullable().optional(),
  announcementId: z.string().trim().min(1).max(128).nullable().optional(),
});

export const resourceLinkSchema = resourceDetailsSchema.extend({
  url: z.string().trim().url("Enter a valid web link."),
});
