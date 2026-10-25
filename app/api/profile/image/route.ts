import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { resolveAvatarUrl } from "@/lib/avatar";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { parseProfileImageUrl } from "@/lib/profile-image";

/** The signed-in user's own profile image. Admins cannot manage someone else's. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { id: true, name: true, image: true },
  });
  return NextResponse.json(
    { image: dbUser.image, avatar: resolveAvatarUrl(dbUser) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("image" in body)) {
    return NextResponse.json(
      { error: "Provide an image URL, or null to remove it." },
      { status: 400 },
    );
  }
  const image = parseProfileImageUrl((body as { image?: unknown }).image);
  if (image && typeof image === "object") {
    return NextResponse.json({ error: image.error }, { status: 400 });
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { image },
    select: { image: true },
  });
  revalidatePath("/", "layout");
  return NextResponse.json({ image: updated.image });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.user.update({ where: { id: user.id }, data: { image: null } });
  revalidatePath("/", "layout");
  return NextResponse.json({ image: null });
}
