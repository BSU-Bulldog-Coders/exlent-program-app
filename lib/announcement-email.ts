import "server-only";
import { sendAnnouncementEmail } from "@/lib/email";

export type AnnouncementEmailInput = Parameters<typeof sendAnnouncementEmail>[0];

/** Feature-level boundary keeps delivery orchestration independent from Resend. */
export function sendQueuedAnnouncementEmail(input: AnnouncementEmailInput) {
  return sendAnnouncementEmail(input);
}
