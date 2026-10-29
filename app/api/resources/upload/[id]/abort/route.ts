import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { abortUpload, deleteResourceObject } from "@/lib/s3";

export async function DELETE(_request: Request, context: RouteContext<"/api/resources/upload/[id]/abort">) {
  await requireAdmin();
  const { id } = await context.params;
  const resource = await prisma.resource.findUnique({ where: { id }, select: { objectKey: true, uploadId: true, uploadStatus: true } });
  if (!resource || resource.uploadStatus !== "PENDING") return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  if (resource.objectKey && resource.uploadId) await abortUpload(resource.objectKey, resource.uploadId).catch(() => undefined);
  if (resource.objectKey) await deleteResourceObject(resource.objectKey).catch(() => undefined);
  await prisma.resource.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
