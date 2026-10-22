import { EmailLayout } from "./layout";

export function InviteEmail({
  inviterName,
  role,
  url,
}: {
  inviterName: string;
  role: "ADMIN" | "STUDENT";
  url: string;
}) {
  const what = role === "ADMIN" ? "an admin of" : "a student in";
  return (
    <EmailLayout
      preview={`${inviterName} invited you to the Exlent program`}
      heading="You're invited"
      cta={{ label: "Accept invitation", href: url }}
    >
      {inviterName} invited you to join the Exlent program as {what} the program. Choose a
      password to finish creating your account. This link expires in 7 days.
    </EmailLayout>
  );
}
