import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsOfService() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <h2>1. Acceptance</h2>
      <p>By creating an account or using the ExLENT Program you agree to these Terms and our Privacy Policy.</p>

      <h2>2. Description of Service</h2>
      <p>The service provides class management, attendance tracking via QR codes, announcements, and resource sharing for educational programs.</p>

      <h2>3. User Responsibilities</h2>
      <p>You are responsible for keeping your password secure and for all activity under your account. Do not share accounts or attempt to access data you are not authorized to view.</p>

      <h2>4. Data Processing</h2>
      <p>We process personal data as described in the Privacy Policy, including 30-day scheduled deletion. By using the service you consent to this processing and to data being transferred to our subprocessors (Resend, database host, S3).</p>

      <h2>5. Termination</h2>
      <p>We may suspend or terminate accounts that violate these terms. You may delete your account at any time (subject to the 30-day grace period).</p>

      <h2>6. Limitation of Liability</h2>
      <p>The service is provided "as is". We are not liable for any indirect or consequential damages arising from use of the application.</p>
    </>
  );
}
