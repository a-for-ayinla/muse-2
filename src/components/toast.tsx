"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

type Toast = { id: number; kind: "success" | "error"; text: string };
const ToastCtx = createContext<{ push: (kind: Toast["kind"], text: string) => void }>({
  push: () => {},
});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border-[3px] border-ink px-4 py-3 font-semibold text-ink shadow-[4px_4px_0_var(--shadow)] anim-rise ${
              t.kind === "success" ? "bg-lime" : "bg-pink"
            }`}
          >
            {t.kind === "success" ? (
              <CheckCircle2 size={20} aria-hidden />
            ) : (
              <AlertTriangle size={20} aria-hidden />
            )}
            <span className="flex-1 text-sm">{t.text}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-full hover:bg-ink/10"
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
