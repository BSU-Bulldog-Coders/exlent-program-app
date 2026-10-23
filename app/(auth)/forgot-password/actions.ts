"use server";

import { z } from "zod";
import { requestPasswordReset } from "@/lib/password-reset";

export type ForgotPasswordState = { error?: string; submitted?: boolean };

const schema = z.object({ email: z.email("Enter a valid email address.").transform((value) => value.toLowerCase()) });

export async function requestPasswordResetAction(
  _previous: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await requestPasswordReset({ email: parsed.data.email });
  // Deliberately identical whether the account exists or not.
  return { submitted: true };
}
