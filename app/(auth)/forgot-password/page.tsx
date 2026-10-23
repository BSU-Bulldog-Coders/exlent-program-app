import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-3xl">Reset your password</h1>
        <p className="text-sm text-muted-foreground">We&apos;ll email you a secure reset link.</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
