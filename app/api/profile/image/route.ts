import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { resolveAvatarUrl } from "@/lib/avatar";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { MAX_AVATAR_SIZE, validateAvatarFile } from "@/lib/profile-image";
import {
  avatarKeyFromUrl,
  avatarObjectKey,
  avatarPublicUrl,
  deleteAvatarObject,
  putAvatarObject,
} from "@/lib/s3";

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

/** Replaces our stored copy of an old avatar. Failures only leave an orphaned object. */
async function removeStoredAvatar(url: string | null | undefined) {
  const key = avatarKeyFromUrl(url);
  if (!key) return;
  try {
    await deleteAvatarObject(key);
  } catch {}
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Reject oversized bodies before buffering them (a little headroom for the multipart envelope).
  const length = Number(request.headers.get("content-length"));
  if (length > MAX_AVATAR_SIZE + 64 * 1024) {
    return NextResponse.json({ error: "Avatar images can be at most 10 MB." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Request body must be form data." }, { status: 400 });
  }
  const checked = validateAvatarFile(form.get("image"));
  if ("error" in checked) {
    return NextResponse.json({ error: checked.error }, { status: checked.status });
  }

  const key = avatarObjectKey(user.id, checked.extension);
  try {
    await putAvatarObject(key, new Uint8Array(await checked.file.arrayBuffer()), checked.file.type);
  } catch {
    return NextResponse.json({ error: "Could not upload the image. Try again." }, { status: 502 });
  }

  const previous = await prisma.user.findUnique({ where: { id: user.id }, select: { image: true } });
  let image: string;
  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { image: avatarPublicUrl(key) },
      select: { image: true },
    });
    image = updated.image!;
  } catch {
    await removeStoredAvatar(avatarPublicUrl(key));
    return NextResponse.json({ error: "Could not save your avatar. Try again." }, { status: 500 });
  }
  await removeStoredAvatar(previous?.image);
  revalidatePath("/", "layout");
  return NextResponse.json({ image });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const previous = await prisma.user.findUnique({ where: { id: user.id }, select: { image: true } });
  await prisma.user.update({ where: { id: user.id }, data: { image: null } });
  await removeStoredAvatar(previous?.image);
  revalidatePath("/", "layout");
  return NextResponse.json({ image: null });
}
