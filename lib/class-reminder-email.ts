import "server-only";
import { sendClassReminderEmail } from "@/lib/email";

/** Feature-level boundary keeps delivery orchestration independent from Resend. */
export function sendQueuedClassReminderEmail(input: Parameters<typeof sendClassReminderEmail>[0]) {
  return sendClassReminderEmail(input);
}
