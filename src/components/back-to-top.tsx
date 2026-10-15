"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * "Back to top" — appears only after ~400px of scroll, never covers the
 * mobile tab bar, keyboard accessible, reduced-motion aware.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > 400);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      className="fixed bottom-20 right-4 z-40 grid h-12 w-12 cursor-pointer place-items-center rounded-full border-[3px] border-ink bg-lime text-ink shadow-[4px_4px_0_var(--shadow)] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--shadow)] active:translate-y-0.5 active:shadow-[2px_2px_0_var(--shadow)] anim-rise md:bottom-8 md:right-8"
    >
      <ArrowUp size={22} aria-hidden />
    </button>
  );
}
