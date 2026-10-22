import { EmailLayout } from "./layout";

export function WelcomeEmail({ name, url }: { name: string; url: string }) {
  return (
    <EmailLayout
      preview="Your account is ready"
      heading={`Welcome, ${name}`}
      cta={{ label: "Open dashboard", href: url }}
    >
      Your ExLENT program account has been created. Scan the QR code your admin displays in
      class and your attendance is recorded automatically while you&apos;re signed in.
    </EmailLayout>
  );
}
