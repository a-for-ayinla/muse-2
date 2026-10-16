"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button, Field, Input, Spinner } from "@/components/primitives";
import { useToast } from "@/components/toast";

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error?.message ?? "Something went wrong. Try again.");
  }
  return data.data;
}

function PasswordInput({
  id,
  value,
  onChange,
  error,
  label = "Password",
  autoComplete,
  hint,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  label?: string;
  autoComplete: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className="pr-14"
          required
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-ph transition-colors hover:text-tx"
        >
          {show ? <EyeOff size={19} aria-hidden /> : <Eye size={19} aria-hidden />}
        </button>
      </div>
    </Field>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl border-2 border-dashed border-accent-2/70 bg-deep px-4 py-3 text-sm font-semibold text-err">
      {message}
    </p>
  );
}

/* ---------------- Login ---------------- */

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    setError(null);
    setLoading(true);
    try {
      await post("/api/auth/login", { email, password });
      const next = params.get("next");
      router.push(next && next.startsWith("/") ? next : "/listen");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <FormError message={error} />
      <Field label="Email" htmlFor="login-email">
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>
      <PasswordInput
        id="login-password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />
      <Button type="submit" disabled={loading} className="mt-1 w-full">
        {loading ? <Spinner label="Logging in" /> : "Log in"}
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link href="/forgot-password" className="font-semibold text-tx2 hover:text-accent">
          Forgot password?
        </Link>
        <Link href="/signup" className="font-semibold text-accent hover:underline">
          New here? Sign up
        </Link>
      </div>
    </form>
  );
}

/* ---------------- Signup ---------------- */

export function SignupForm() {
  const router = useRouter();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (name.trim().length < 1) errs.name = "Tell us what to call you.";
    if (!email.includes("@")) errs.email = "Enter a valid email address.";
    if (password.length < 8) errs.password = "At least 8 characters.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setError(null);
    setLoading(true);
    try {
      const data = await post("/api/auth/signup", { email, password, displayName: name.trim() });
      push("success", "Account created — welcome to Muse.");
      if (data?.notice) setTimeout(() => push("success", data.notice), 600);
      router.push("/listen");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <FormError message={error} />
      <Field label="What should Muse call you?" htmlFor="signup-name" error={errors.name}>
        <Input
          id="signup-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Your name or alias"
          aria-invalid={!!errors.name}
          required
        />
      </Field>
      <Field label="Email" htmlFor="signup-email" error={errors.email}>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          required
        />
      </Field>
      <PasswordInput
        id="signup-password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        autoComplete="new-password"
        hint="At least 8 characters. Make it something a DJ can't guess."
      />
      <Button type="submit" disabled={loading} className="mt-1 w-full">
        {loading ? <Spinner label="Creating account" /> : "Create free account"}
      </Button>
      <p className="text-center text-sm text-tx2">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

/* ---------------- Forgot ---------------- */

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ message: string; devLink?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return setError("Enter a valid email address.");
    setError(null);
    setLoading(true);
    try {
      const data = await post("/api/auth/forgot-password", { email });
      setResult({ message: data.message, devLink: data.devLink });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start recovery.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="grid gap-5">
        <div className="rounded-3xl border-2 border-card-line bg-surf p-5 text-tx">
          <p className="font-bagel text-xl text-accent">Check on it</p>
          <p className="mt-2 text-sm leading-relaxed text-tx/85">{result.message}</p>
          {result.devLink && (
            <p className="mt-3 text-sm">
              <span className="text-dim">Development only: </span>
              <a href={result.devLink} className="font-semibold text-accent break-all hover:underline">
                Open your reset link
              </a>
            </p>
          )}
        </div>
        <Link href="/login" className="text-center text-sm font-semibold text-accent hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <FormError message={error} />
      <Field label="Email" htmlFor="forgot-email">
        <Input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Spinner label="Sending" /> : "Send reset link"}
      </Button>
      <Link href="/login" className="text-center text-sm font-semibold text-tx2 hover:text-accent">
        Back to log in
      </Link>
    </form>
  );
}

/* ---------------- Reset ---------------- */

export function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { push } = useToast();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return setError("This link is missing its token. Request a fresh one.");
    if (password.length < 8) return setError("At least 8 characters.");
    setError(null);
    setLoading(true);
    try {
      await post("/api/auth/reset-password", { token, password });
      push("success", "Password updated. Log in with the new one.");
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <FormError message={error} />
      {!token && (
        <p className="rounded-2xl border-2 border-dashed border-line bg-deep px-4 py-3 text-sm text-muted">
          No reset token found in this link.{" "}
          <Link href="/forgot-password" className="font-semibold text-accent hover:underline">
            Request a new link
          </Link>
          .
        </p>
      )}
      <PasswordInput
        id="reset-password"
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint="At least 8 characters."
      />
      <Button type="submit" disabled={loading || !token} className="w-full">
        {loading ? <Spinner label="Updating" /> : "Set new password"}
      </Button>
    </form>
  );
}
