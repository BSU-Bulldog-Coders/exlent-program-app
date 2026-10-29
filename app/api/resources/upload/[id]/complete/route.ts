import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { completeUpload, headResource } from "@/lib/s3";

type UploadedPart = { partNumber: number; etag: string };

export async function POST(request: Request, context: RouteContext<"/api/resources/upload/[id]/complete">) {
  await requireAdmin();
  const { id } = await context.params;
  const { parts } = await request.json().catch(() => ({})) as { parts?: UploadedPart[] };
  const resource = await prisma.resource.findUnique({ where: { id }, select: { objectKey: true, uploadId: true, sizeBytes: true, uploadStatus: true } });
  if (!resource?.objectKey || resource.uploadStatus !== "PENDING") return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  try {
    if (resource.uploadId) {
      if (!Array.isArray(parts) || parts.length === 0 || !parts.every((part) => Number.isInteger(part.partNumber) && typeof part.etag === "string")) {
        return NextResponse.json({ error: "Invalid upload parts." }, { status: 400 });
      }
      await completeUpload(resource.objectKey, resource.uploadId, parts.map((part) => ({ ETag: part.etag, PartNumber: part.partNumber })));
    }
    const object = await headResource(resource.objectKey);
    if (object.ContentLength !== resource.sizeBytes) throw new Error("Uploaded size did not match.");
    await prisma.resource.update({ where: { id }, data: { uploadStatus: "READY", uploadId: null } });
    revalidatePath("/resources");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not finalize the upload." }, { status: 502 });
  }
}
