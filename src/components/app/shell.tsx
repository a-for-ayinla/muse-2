"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronUp, Headphones, History, ListMusic, LogOut, Mic, Settings } from "lucide-react";
import { Logo, LogoMark } from "@/components/primitives";
import { ThemeToggle } from "@/components/theme-toggle";
import { OnboardingGate } from "@/components/app/onboarding";
import { cn } from "@/lib/cn";

export type ShellUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  preferredLanguage: string;
  genres: string[];
  moods: string[];
  preferredPlatform: string;
  onboardingCompleted: boolean;
};

const TABS = [
  { href: "/listen", label: "Listen", icon: Headphones },
  { href: "/create", label: "Create", icon: Mic },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

function initials(name: string, email: string): string {
  const src = name.trim() || email;
  return src.slice(0, 1).toUpperCase();
}

export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const railLink = (t: (typeof TABS)[number]) => (
    <Link
      key={t.href}
      href={t.href}
      aria-current={isActive(t.href) ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-2xl px-4 font-semibold transition-all",
        isActive(t.href)
          ? "bg-lime text-ink shadow-[3px_3px_0_var(--shadow)]"
          : "text-tx2 hover:bg-raise/50 hover:text-tx",
      )}
    >
      <t.icon size={20} aria-hidden />
      {t.label}
    </Link>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop left rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r-2 border-line/40 bg-bg px-5 py-6 lg:flex">
        <Link href="/listen" aria-label="Muse app home" className="rounded-full px-2">
          <Logo size={36} />
        </Link>
        <nav aria-label="App navigation" className="mt-10 grid gap-2">
          {TABS.map(railLink)}
        </nav>
        <div className="mt-auto grid gap-3">
          <div className="flex items-center justify-between px-2">
            <ThemeToggle />
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex cursor-pointer items-center gap-2 rounded-full border-2 border-fieldline bg-field py-1.5 pl-1.5 pr-3 transition-colors hover:border-accent"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-lime font-bagel text-sm text-ink">
                  {initials(user.displayName, user.email)}
                </span>
                <ChevronUp size={15} aria-hidden className={cn("text-tx2 transition-transform", !menuOpen && "rotate-180")} />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute bottom-14 right-0 w-60 rounded-3xl border-2 border-card-line bg-surf p-3 text-tx shadow-[6px_6px_0_var(--raise)]"
                >
                  <p className="truncate px-3 pb-1 pt-2 font-semibold">{user.displayName || "Muse user"}</p>
                  <p className="truncate px-3 pb-2 text-xs text-dim">{user.email}</p>
                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-11 items-center gap-2 rounded-2xl px-3 text-sm font-semibold hover:bg-raise"
                  >
                    <Settings size={17} aria-hidden /> Settings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={logout}
                    className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-2xl px-3 text-left text-sm font-semibold text-err hover:bg-raise"
                  >
                    <LogOut size={17} aria-hidden /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-2 border-line/40 bg-bg px-5 lg:hidden">
        <Link href="/listen" aria-label="Muse app home" className="rounded-full">
          <LogoMark size={32} />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border-2 border-fieldline text-tx2 transition-colors hover:text-accent"
          >
            <LogOut size={18} aria-hidden />
          </button>
        </div>
      </header>

      {/* Content */}
      <main id="main" className="pb-28 lg:pb-12 lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-5 pt-8 md:px-8">{children}</div>
      </main>

      {/* Mobile bottom tab bar (44px+ targets) */}
      <nav
        aria-label="App tabs"
        className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-line/60 bg-bg/95 backdrop-blur-sm lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {TABS.map((t) => (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={isActive(t.href) ? "page" : undefined}
                aria-label={t.label}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-semibold transition-colors",
                  isActive(t.href) ? "text-accent" : "text-tx2 hover:text-tx",
                )}
              >
                <t.icon size={21} aria-hidden />
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {!user.onboardingCompleted && <OnboardingGate user={user} />}
    </div>
  );
}
