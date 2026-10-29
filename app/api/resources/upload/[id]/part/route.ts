import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { signedPart } from "@/lib/s3";

export async function POST(request: Request, context: RouteContext<"/api/resources/upload/[id]/part">) {
  await requireAdmin();
  const { id } = await context.params;
  const { partNumber } = await request.json().catch(() => ({}));
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000) return NextResponse.json({ error: "Invalid part number." }, { status: 400 });
  const resource = await prisma.resource.findUnique({ where: { id }, select: { objectKey: true, uploadId: true, uploadStatus: true } });
  if (!resource?.objectKey || !resource.uploadId || resource.uploadStatus !== "PENDING") return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  return NextResponse.json({ uploadUrl: await signedPart(resource.objectKey, resource.uploadId, partNumber) });
}
