import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back." subtitle="The night is young. Log in and ask for something." art="record">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
