import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Start with a vibe."
      subtitle="Free account. Real songs. Your culture, understood."
      art="equalizer"
    >
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
