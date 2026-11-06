import { NextResponse } from "next/server";
import { deliverDueAnnouncementDeliveries } from "@/lib/announcement-delivery";
import { deliverDueAttendanceWarnings } from "@/lib/attendance-warning-delivery";
import { evaluatePendingClassClosures } from "@/lib/attendance-warnings";
import { deliverDueOutboxEvents } from "@/lib/password-reset";
import { purgeDueUserDeletions } from "@/lib/user-deletion";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Re-run any missed-classes check that never finished before delivering the
  // warnings it may have queued.
  const attendanceChecks = await evaluatePendingClassClosures();
  const [passwordResets, announcements, attendanceWarnings, accountDeletions] = await Promise.all([
    deliverDueOutboxEvents(),
    deliverDueAnnouncementDeliveries(),
    deliverDueAttendanceWarnings(),
    purgeDueUserDeletions(),
  ]);
  const result = { passwordResets, announcements, attendanceChecks, attendanceWarnings, accountDeletions };
  return NextResponse.json(result);
}
