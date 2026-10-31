import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicy() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <h2>1. Information We Collect</h2>
      <p>We collect the following categories of personal data:</p>
      <ul>
        <li><strong>Account data:</strong> name, email address, role (admin/student), verification status.</li>
        <li><strong>Session & device data:</strong> IP address, user agent (stored in Session records).</li>
        <li><strong>Program activity:</strong> attendance records, class participation, announcement deliveries (recipient email retained for audit).</li>
        <li><strong>Optional:</strong> profile image, resource uploads (stored in S3).</li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <p>Data is used to provide the attendance, announcement, and resource management service, enforce authentication, and comply with legal obligations.</p>

      <h2>3. Data Retention & Deletion</h2>
      <p>Account deletion may be requested by users or performed by admins. A 30-day grace period applies (see <code>deletionScheduledAt</code> / <code>deletionDueAt</code> in the User model). After the grace period, personal data is permanently removed. Session records and delivery logs are retained only as long as necessary for security and audit purposes.</p>

      <h2>4. Third-Party Processors</h2>
      <ul>
        <li><strong>Resend</strong> – transactional email delivery (announcements, invites, password resets, verifications).</li>
        <li><strong>PostgreSQL provider</strong> (Neon/Supabase or equivalent) – primary database.</li>
        <li><strong>S3-compatible storage</strong> – file resources and uploads.</li>
      </ul>
      <p>These processors are contractually bound to process data only on our instructions and to implement appropriate security measures.</p>

      <h2>5. Your Rights</h2>
      <p>You may request access, correction, or deletion of your personal data by contacting an administrator or using the in-app profile tools. Students may request account deletion; admins manage scheduled deletions via the People section.</p>

      <h2>6. Cookies & Tracking</h2>
      <p>We use essential session cookies for authentication. No marketing or third-party analytics cookies are set. IP/session data is stored server-side for security.</p>
    </>
  );
}
