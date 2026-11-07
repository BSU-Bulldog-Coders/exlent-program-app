import { EmailLayout } from "./layout";

export function ClassReminderEmail({
  name,
  className,
  startsAt,
  url,
}: {
  name: string;
  className: string;
  /** Already formatted in the class's timezone. */
  startsAt: string;
  url: string;
}) {
  return (
    <EmailLayout
      preview={`Reminder: ${className}`}
      heading={`See you in class, ${name}`}
      cta={{ label: "Open class", href: url }}
    >
      {className} is scheduled for {startsAt}. Please attend and check in when you arrive: open the
      class and tap Check in, or scan the QR code in the room. Check-in needs your location, so
      allow location access when your browser asks.
    </EmailLayout>
  );
}
