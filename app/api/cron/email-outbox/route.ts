import { NextResponse } from "next/server";
import { deliverDueAnnouncementDeliveries } from "@/lib/announcement-delivery";
import { deliverDueOutboxEvents } from "@/lib/password-reset";
import { purgeDueUserDeletions } from "@/lib/user-deletion";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [passwordResets, announcements, accountDeletions] = await Promise.all([
    deliverDueOutboxEvents(),
    deliverDueAnnouncementDeliveries(),
    purgeDueUserDeletions(),
  ]);
  const result = { passwordResets, announcements, accountDeletions };
  return NextResponse.json(result);
}
