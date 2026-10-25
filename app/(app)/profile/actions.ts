"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { parseProfileImageUrl } from "@/lib/profile-image";

export type ProfileState = { error?: string; saved?: boolean };

const schema = z.object({ name: z.string().trim().min(1, "Enter your name.").max(100) });

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();
  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const image = parseProfileImageUrl(formData.get("image"));
  if (image && typeof image === "object") return { error: image.error };

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, image },
  });
  revalidatePath("/", "layout");
  return { saved: true };
}
