import { EmailLayout } from "./layout";

export function VerifyEmail({ name, url }: { name: string; url: string }) {
  return (
    <EmailLayout
      preview="Verify your email address"
      heading="Verify your email"
      cta={{ label: "Verify email", href: url }}
    >
      Hi {name}, confirm your email address to finish creating your Exlent program account.
    </EmailLayout>
  );
}
