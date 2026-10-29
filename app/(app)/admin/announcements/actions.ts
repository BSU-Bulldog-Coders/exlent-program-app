"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { deliverDueAnnouncementDeliveries } from "@/lib/announcement-delivery";
import { prisma } from "@/lib/announcement-store";
import { requireAdmin } from "@/lib/dal";
import { z } from "zod";

export type AnnouncementActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const announcementSchema = z.object({
  title: z.string().trim().min(1, "Enter an announcement title.").max(160),
  body: z.string().trim().min(1, "Enter an announcement message.").max(20_000),
  classId: z.string().trim().max(128).nullable(),
  emailRequested: z.boolean(),
  resourceIds: z.array(z.string().trim().max(128)).default([]),
});

function normalizeClassId(value: string | null) {
  return value || null;
}

async function ensureClassExists(classId: string | null) {
  if (!classId) return true;
  return Boolean(await prisma.class.findUnique({ where: { id: classId }, select: { id: true } }));
}

function revalidateAnnouncements() {
  revalidatePath("/");
}

export async function createAnnouncement(
  input: z.input<typeof announcementSchema>,
): Promise<AnnouncementActionResult<{ id: string; recipients: number }>> {
  const admin = await requireAdmin();
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const values = { ...parsed.data, classId: normalizeClassId(parsed.data.classId) };
  if (!(await ensureClassExists(values.classId))) return { ok: false, error: "Class not found." };

  const announcementId = randomUUID();
  const created = await prisma.$transaction(async (tx) => {
    const linkedClass = values.classId
      ? await tx.class.findUnique({ where: { id: values.classId }, select: { name: true } })
      : null;
    const recipients = values.emailRequested
      ? await tx.user.findMany({
          where: { emailVerified: true },
          select: { id: true, email: true },
        })
      : [];
    await tx.announcement.create({
      data: {
        id: announcementId,
        title: values.title,
        body: values.body,
        classId: values.classId,
        authorId: admin.id,
        emailRequested: values.emailRequested,
        deliveries: {
          createMany: {
            data: recipients.map((recipient) => ({
              recipientEmail: recipient.email,
              payload: {
                title: values.title,
                body: values.body,
                className: linkedClass?.name ?? null,
              },
              idempotencyKey: `announcement:${announcementId}:${recipient.id}`,
            })),
          },
        },
      },
    });
    if (values.resourceIds.length) {
      await tx.resource.updateMany({
        where: { id: { in: values.resourceIds }, uploadStatus: "READY" },
        data: { announcementId },
      });
    }
    await tx.user.update({
      where: { id: admin.id },
      data: { announcementEmailDefault: values.emailRequested },
    });
    return recipients.length;
  });

  revalidateAnnouncements();
  if (values.emailRequested && created > 0) {
    after(async () => {
      await deliverDueAnnouncementDeliveries();
    });
  }
  return { ok: true, id: announcementId, recipients: created };
}

export async function updateAnnouncement(
  id: string,
  input: z.input<typeof announcementSchema>,
): Promise<AnnouncementActionResult> {
  await requireAdmin();
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const values = { ...parsed.data, classId: normalizeClassId(parsed.data.classId) };
  if (!(await ensureClassExists(values.classId))) return { ok: false, error: "Class not found." };

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.announcement.updateMany({
      where: { id },
      data: { title: values.title, body: values.body, classId: values.classId },
    });
    if (result.count) {
      await tx.resource.updateMany({ where: { announcementId: id }, data: { announcementId: null } });
      if (values.resourceIds.length) await tx.resource.updateMany({ where: { id: { in: values.resourceIds }, uploadStatus: "READY" }, data: { announcementId: id } });
    }
    return result;
  });
  if (updated.count === 0) return { ok: false, error: "Announcement not found." };
  revalidateAnnouncements();
  return { ok: true };
}

export async function deleteAnnouncement(id: string): Promise<AnnouncementActionResult> {
  await requireAdmin();
  // Marking outstanding rows before the cascade makes concurrent workers lose
  // their claim; the rows are then removed with the announcement itself.
  const deleted = await prisma.$transaction(async (tx) => {
    await tx.announcementDelivery.updateMany({
      where: {
        announcementId: id,
        status: { in: ["PENDING", "PROCESSING"] },
      },
      data: { status: "CANCELED", lockedUntil: null, leaseId: null },
    });
    return tx.announcement.deleteMany({ where: { id } });
  });
  if (deleted.count === 0) return { ok: false, error: "Announcement not found." };
  revalidateAnnouncements();
  return { ok: true };
}

export async function retryFailedAnnouncementDeliveries(
  announcementId: string,
): Promise<AnnouncementActionResult<{ recipients: number }>> {
  await requireAdmin();
  const retried = await prisma.announcementDelivery.updateMany({
    where: { announcementId, status: "FAILED" },
    data: {
      status: "PENDING",
      attempts: 0,
      nextAttemptAt: new Date(),
      lockedUntil: null,
      leaseId: null,
      lastError: null,
    },
  });
  if (retried.count > 0) {
    after(async () => {
      await deliverDueAnnouncementDeliveries();
    });
  }
  revalidateAnnouncements();
  return { ok: true, recipients: retried.count };
}
