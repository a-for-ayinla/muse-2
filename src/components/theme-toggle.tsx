"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Theme toggle. Dark is the default; the stored choice wins, otherwise the
 * system preference applies. The anti-flash script in the root layout reads
 * the same localStorage key. State is read from <html data-theme> via an
 * external store so the toggle always reflects the applied theme.
 */
function useTheme(): "dark" | "light" {
  return useSyncExternalStore(
    (callback) => {
      const obs = new MutationObserver(callback);
      obs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      return () => obs.disconnect();
    },
    () => (document.documentElement.dataset.theme === "light" ? "light" : "dark"),
    () => "dark",
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("muse-theme", next);
    } catch {
      /* private mode — preference simply won't persist */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={theme === "light"}
      className={
        className ??
        "grid h-11 w-11 cursor-pointer place-items-center rounded-full border-2 border-fieldline bg-field text-tx transition-all hover:-translate-y-0.5 hover:border-lime hover:text-lime"
      }
    >
      {theme === "dark" ? <Sun size={19} aria-hidden /> : <Moon size={19} aria-hidden />}
    </button>
  );
}
