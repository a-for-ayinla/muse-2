import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <AuthShell title="New keys, same ride." subtitle="Set a fresh password for your account." art="record">
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
