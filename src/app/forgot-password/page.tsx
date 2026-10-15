import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Lost the keys?" subtitle="Tell us your email and we'll sort a reset link." art="equalizer">
      <ForgotForm />
    </AuthShell>
  );
}
