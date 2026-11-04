"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { deleteResourceObject } from "@/lib/s3";
import { normalizeResourceLink, resourceDetailsSchema, resourceLinkSchema } from "@/lib/resources";

export type ResourceActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function revalidateResources(classId?: string | null) {
  revalidatePath("/resources");
  revalidatePath("/");
  if (classId) {
    revalidatePath(`/classes/${classId}`);
    revalidatePath(`/admin/classes/${classId}`);
  }
}

async function linksExist(classId: string | null, announcementId: string | null) {
  const [item, announcement] = await Promise.all([
    classId ? prisma.class.findUnique({ where: { id: classId }, select: { id: true } }) : null,
    announcementId ? prisma.announcement.findUnique({ where: { id: announcementId }, select: { id: true } }) : null,
  ]);
  return (!classId || item) && (!announcementId || announcement);
}

export async function createLinkResource(input: {
  title: string; description?: string; classId: string | null; announcementId?: string | null; url: string;
}): Promise<ResourceActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = resourceLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { url, ...metadata } = parsed.data;
  const youtubeUrl = normalizeResourceLink(url);
  if (!youtubeUrl) return { ok: false, error: "Enter a valid web link." };
  const values = { ...metadata, classId: metadata.classId || null, announcementId: metadata.announcementId || null };
  try {
    if (!(await linksExist(values.classId, values.announcementId))) return { ok: false, error: "The selected class or announcement no longer exists." };
    const resource = await prisma.resource.create({ data: { ...values, kind: "YOUTUBE", youtubeUrl, createdById: admin.id } });
    revalidateResources(values.classId);
    return { ok: true, id: resource.id };
  } catch {
    return { ok: false, error: "Could not save the resource. Please try again." };
  }
}

export async function updateResourceDetails(id: string, input: {
  title: string; description?: string; classId: string | null; announcementId: string | null; youtubeUrl?: string;
}): Promise<ResourceActionResult> {
  await requireAdmin();
  const parsed = resourceDetailsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const values = { ...parsed.data, classId: parsed.data.classId || null, announcementId: parsed.data.announcementId || null };
  try {
    if (!(await linksExist(values.classId, values.announcementId))) return { ok: false, error: "The selected class or announcement no longer exists." };
    const current = await prisma.resource.findUnique({ where: { id }, select: { kind: true, classId: true } });
    if (!current) return { ok: false, error: "Resource not found." };
    let youtubeUrl: string | undefined;
    if (current.kind === "YOUTUBE" && input.youtubeUrl !== undefined) {
      youtubeUrl = normalizeResourceLink(input.youtubeUrl) ?? undefined;
      if (!youtubeUrl) return { ok: false, error: "Enter a valid web link." };
    }
    await prisma.resource.update({ where: { id }, data: { ...values, ...(youtubeUrl ? { youtubeUrl } : {}) } });
    revalidateResources(current.classId);
    revalidateResources(values.classId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update the resource. Please try again." };
  }
}

export async function deleteResource(id: string): Promise<ResourceActionResult> {
  await requireAdmin();
  try {
    const item = await prisma.resource.findUnique({ where: { id }, select: { objectKey: true, classId: true, uploadId: true } });
    if (!item) return { ok: false, error: "Resource not found." };
    await prisma.resource.delete({ where: { id } });
    if (item.objectKey) await deleteResourceObject(item.objectKey).catch(() => undefined);
    revalidateResources(item.classId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete the resource. Please try again." };
  }
}
