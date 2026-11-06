import { EmailLayout } from "./layout";

export function AttendanceWarningEmail({
  name,
  previousClassName,
  className,
  url,
}: {
  name: string;
  previousClassName: string;
  className: string;
  url: string;
}) {
  return (
    <EmailLayout
      preview="You've missed your last two classes"
      heading={`We missed you, ${name}`}
      cta={{ label: "Open dashboard", href: url }}
    >
      You weren&apos;t marked present for {previousClassName} or {className}. This is a heads-up
      to help you stay on track. If you miss the next class as well, your account will be
      scheduled for removal from the program. Attending any class clears this warning.
    </EmailLayout>
  );
}
