import { EmailLayout } from "./layout";

export function ResetPasswordEmail({ name, url }: { name: string; url: string }) {
  return (
    <EmailLayout
      preview="Reset your ExLENT program password"
      heading="Reset your password"
      cta={{ label: "Reset password", href: url }}
    >
      Hi {name}, use this link to choose a new password for your ExLENT program account. It
      expires in 24 hours. If you did not request this, you can safely ignore this email.
    </EmailLayout>
  );
}
