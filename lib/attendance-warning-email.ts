import "server-only";
import { sendAttendanceWarningEmail } from "@/lib/email";

/** Feature-level boundary keeps delivery orchestration independent from Resend. */
export function sendQueuedAttendanceWarningEmail(input: Parameters<typeof sendAttendanceWarningEmail>[0]) {
  return sendAttendanceWarningEmail(input);
}
