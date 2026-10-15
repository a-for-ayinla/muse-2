"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/primitives";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "#listen", label: "Listen" },
  { href: "#create", label: "Create" },
  { href: "#how", label: "How it works" },
  { href: "#why", label: "Why Muse" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b-2 border-line/40 bg-bg/90 backdrop-blur-sm">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-20 max-w-[1240px] items-center justify-between px-7"
      >
        <Link href="/" aria-label="Muse home" className="rounded-full">
          <Logo size={38} />
        </Link>
        <ul className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-lg text-[15px] font-medium text-tx2 transition-colors hover:text-lime"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-full border-2 border-tx px-6 font-semibold text-tx shadow-[4px_4px_0_var(--raise)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--raise)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_var(--raise)]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center rounded-full bg-lime px-6 font-semibold text-ink shadow-[4px_4px_0_var(--shadow)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--shadow)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_var(--shadow)]"
          >
            Sign up
          </Link>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border-2 border-tx/30 text-tx"
          >
            {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-t-2 border-line/40 bg-bg px-7 pb-6 pt-3 lg:hidden">
          <ul className="grid gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block min-h-11 rounded-2xl px-3 py-3 text-lg font-medium text-tx hover:bg-raise/40"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/login"
              className="grid min-h-11 place-items-center rounded-full border-2 border-tx font-semibold text-tx"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="grid min-h-11 place-items-center rounded-full bg-lime font-semibold text-ink"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
