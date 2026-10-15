import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/primitives";

export const metadata: Metadata = { title: "Confirm email" };

/**
 * Email-confirmation landing. Email delivery is not configured in this
 * environment, so accounts activate immediately at signup — this page
 * documents that state honestly instead of faking a confirmation.
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  const { token, status } = await searchParams;
  return (
    <AuthShell title="Email confirmation" subtitle="Where confirmation links land." art="record">
      <div className="grid gap-5">
        {status === "ok" ? (
          <p className="rounded-3xl border-2 border-[#2A2D23] bg-surf p-5 text-cream">
            Your email is confirmed. You can log in now.
          </p>
        ) : status === "error" ? (
          <p className="rounded-3xl border-2 border-dashed border-pink/70 bg-deep p-5 text-[#FF8A85]">
            That confirmation link is invalid or expired. Sign up again or request a new one.
          </p>
        ) : token ? (
          <p className="rounded-3xl border-2 border-[#2A2D23] bg-surf p-5 text-sm text-cream/85">
            Tokens are only issued when email delivery is configured. In this environment no
            confirmation email is required — your account was activated at signup.
          </p>
        ) : (
          <p className="rounded-3xl border-2 border-[#2A2D23] bg-surf p-5 text-sm leading-relaxed text-cream/85">
            Email delivery isn&rsquo;t configured in this environment, so accounts are active the
            moment you sign up. No confirmation email is sent or required.
          </p>
        )}
        <Link href="/login" className="w-fit">
          <Button>Go to log in</Button>
        </Link>
      </div>
    </AuthShell>
  );
}
