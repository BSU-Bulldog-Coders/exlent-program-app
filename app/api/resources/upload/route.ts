import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { DIRECT_UPLOAD_LIMIT, createUpload, resourceObjectKey, signedPut } from "@/lib/s3";
import { fileExtension, isAllowedResourceFile, resourceDetailsSchema } from "@/lib/resources";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const body = await request.json().catch(() => null) as null | { title?: string; description?: string; classId?: string | null; announcementId?: string | null; file?: { name?: string; type?: string; size?: number } };
  const details = resourceDetailsSchema.safeParse(body);
  const file = body?.file;
  if (!details.success || !file || typeof file.name !== "string" || typeof file.type !== "string" || typeof file.size !== "number") {
    return NextResponse.json({ error: "Invalid resource upload." }, { status: 400 });
  }
  const values = { ...details.data, classId: details.data.classId || null, announcementId: details.data.announcementId || null };
  const extension = fileExtension(file.name);
  if (!extension || !isAllowedResourceFile(file.name, file.type, file.size)) return NextResponse.json({ error: "This file type or size is not allowed." }, { status: 400 });
  const [linkedClass, linkedAnnouncement] = await Promise.all([
    values.classId ? prisma.class.findUnique({ where: { id: values.classId }, select: { id: true } }) : null,
    values.announcementId ? prisma.announcement.findUnique({ where: { id: values.announcementId }, select: { id: true } }) : null,
  ]);
  if ((values.classId && !linkedClass) || (values.announcementId && !linkedAnnouncement)) return NextResponse.json({ error: "The selected link no longer exists." }, { status: 400 });
  const resource = await prisma.resource.create({ data: { ...values, kind: "FILE", uploadStatus: "PENDING", originalName: file.name, contentType: file.type, sizeBytes: file.size, createdById: admin.id } });
  const objectKey = resourceObjectKey(resource.id, extension);
  try {
    if (file.size <= DIRECT_UPLOAD_LIMIT) {
      const uploadUrl = await signedPut(objectKey, file.type);
      await prisma.resource.update({ where: { id: resource.id }, data: { objectKey } });
      return NextResponse.json({ id: resource.id, mode: "single", uploadUrl });
    }
    const upload = await createUpload(objectKey, file.type);
    if (!upload.UploadId) throw new Error("Storage did not return an upload id.");
    await prisma.resource.update({ where: { id: resource.id }, data: { objectKey, uploadId: upload.UploadId } });
    return NextResponse.json({ id: resource.id, mode: "multipart" });
  } catch {
    await prisma.resource.delete({ where: { id: resource.id } }).catch(() => undefined);
    return NextResponse.json({ error: "Could not prepare the upload." }, { status: 502 });
  }
}
