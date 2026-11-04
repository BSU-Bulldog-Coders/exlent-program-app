import { NextResponse } from "next/server";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { signedGet } from "@/lib/s3";

export async function GET(request: Request, context: RouteContext<"/api/resources/[id]/file">) {
  await requireUser();
  const { id } = await context.params;
  const resource = await prisma.resource.findFirst({ where: { id, kind: "FILE", uploadStatus: "READY" }, select: { objectKey: true, originalName: true } });
  if (!resource?.objectKey || !resource.originalName) return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  const download = new URL(request.url).searchParams.get("download") === "1";
  return NextResponse.redirect(await signedGet(resource.objectKey, resource.originalName, download));
}
