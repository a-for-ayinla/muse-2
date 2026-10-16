"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

/* ================= Logo (locked mark — do not redraw) ================= */

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
      <rect width="48" height="48" rx="15" fill="#C8FF2E" />
      <path
        d="M12 35V17l12 12 12-12v18"
        fill="none"
        stroke="#0E0F0C"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="13" r="3.6" fill="#0E0F0C" />
    </svg>
  );
}

export function Logo({
  variant = "full",
  size = 40,
  className,
}: {
  variant?: "mark" | "full";
  size?: number;
  className?: string;
}) {
  if (variant === "mark") return <LogoMark size={size} className={className} />;
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className="font-bagel text-tx leading-none" style={{ fontSize: size * 0.72 }}>
        muse
      </span>
    </span>
  );
}

/* ================= Button ================= */

type ButtonVariant = "primary" | "outline" | "ink" | "ghost" | "danger";

const buttonBase =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-2.5 font-fredoka text-base font-semibold tracking-tight transition-all duration-150 select-none disabled:pointer-events-none disabled:opacity-50";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-lime text-ink shadow-[5px_5px_0_var(--shadow)] hover:-translate-x-0.75 hover:-translate-y-0.75 hover:shadow-[8px_8px_0_var(--shadow)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_var(--shadow)]",
  outline:
    "border-2 border-tx bg-transparent text-tx shadow-[5px_5px_0_var(--raise)] hover:-translate-x-0.75 hover:-translate-y-0.75 hover:shadow-[8px_8px_0_var(--raise)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_var(--raise)] data-[pagebg=light]:border-current",
  ink: "bg-ink text-cream shadow-[5px_5px_0_#FF6B9A] hover:-translate-x-0.75 hover:-translate-y-0.75 hover:shadow-[8px_8px_0_#FF6B9A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#FF6B9A]",
  ghost: "bg-transparent text-tx hover:bg-raise active:bg-raise",
  danger:
    "bg-[#B3271E] text-cream shadow-[5px_5px_0_var(--shadow)] hover:-translate-x-0.75 hover:-translate-y-0.75 hover:shadow-[8px_8px_0_var(--shadow)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_var(--shadow)]",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }
>(function Button({ variant = "primary", className, type = "button", ...props }, ref) {
  return (
    <button ref={ref} type={type} className={cn(buttonBase, buttonVariants[variant], className)} {...props} />
  );
});

/* ================= Chip ================= */

export const Chip = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }
>(function Chip({ active, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "border-ink bg-lime text-ink shadow-[3px_3px_0_var(--shadow)]"
          : "border-fieldline bg-field text-tx hover:-translate-y-0.5 hover:border-tx",
        className,
      )}
      {...props}
    />
  );
});

/* ================= Sticker badge ================= */

export function Sticker({
  children,
  color = "lime",
  rotate = -3,
  className,
}: {
  children: ReactNode;
  color?: "lime" | "cream" | "pink";
  rotate?: number;
  className?: string;
}) {
  const colors = {
    lime: "bg-lime text-ink",
    cream: "bg-cream text-ink",
    pink: "bg-pink text-ink",
  } as const;
  return (
    <span
      className={cn(
        "inline-block rounded-xl border-[3px] border-ink px-3 py-1 font-bagel text-sm leading-none shadow-[3px_3px_0_var(--shadow)]",
        colors[color],
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}

/* ================= Panel ================= */

export function Panel({
  children,
  className,
  deep,
}: {
  children: ReactNode;
  className?: string;
  deep?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border-2 p-6",
        deep
          ? "border-card-line bg-deep text-tx shadow-[10px_10px_0_var(--raise)]"
          : "border-card-line bg-surf text-tx",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ================= Inputs ================= */

const fieldClass =
  "w-full rounded-2xl border-2 border-fieldline bg-field px-4 py-3 text-base text-tx placeholder:text-ph transition-colors hover:border-tx/40";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldClass, "min-h-11", className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(fieldClass, "min-h-28 resize-y", className)} {...props} />;
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(fieldClass, "min-h-11 cursor-pointer appearance-none pr-10", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='9' fill='none'%3E%3Cpath d='M1 1.5 7 7.5 13 1.5' stroke='%238E9081' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 1rem center",
      }}
      {...props}
    />
  );
});

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-tx">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-tx2">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm font-semibold text-err">
          {error}
        </p>
      )}
    </div>
  );
}

/* ================= Mode toggle (Listen / Create) ================= */

export function ModeToggle({
  value,
  onChange,
  className,
  label,
}: {
  value: "listen" | "create";
  onChange: (v: "listen" | "create") => void;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label ?? "Choose mode"}
      className={cn(
        "inline-flex rounded-full border-2 border-fieldline bg-deep p-1.5 shadow-[4px_4px_0_var(--raise)]",
        className,
      )}
    >
      {(["listen", "create"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className={cn(
            "min-h-11 cursor-pointer rounded-full px-7 font-bagel text-lg capitalize transition-all duration-150",
            value === mode
              ? "bg-lime text-ink shadow-[3px_3px_0_var(--shadow)]"
              : "text-tx2 hover:text-tx",
          )}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

/* ================= Equalizer ================= */

export function Equalizer({
  bars = 12,
  className,
  colors = ["var(--accent)", "var(--tx)", "var(--accent-2)"],
  label,
}: {
  bars?: number;
  className?: string;
  colors?: string[];
  label?: string;
}) {
  return (
    <div
      className={cn("flex h-10 items-end gap-1", className)}
      role="img"
      aria-label={label ?? "Animated equalizer"}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="eq-bar w-1.5 rounded-full"
          style={{
            height: `${35 + ((i * 37) % 65)}%`,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${(i % 7) * 0.12}s`,
            animationDuration: `${0.8 + (i % 5) * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ================= Record (spinning vinyl) ================= */

export function Record({
  size = 320,
  className,
  label = "Spinning vinyl record",
}: {
  size?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, maxWidth: "100%", aspectRatio: "1 / 1" }}
    >
      {/* offset lime disc behind */}
      <span
        aria-hidden
        className="absolute rounded-full bg-lime"
        style={{ width: "92%", height: "92%", transform: "translate(5%, 5%)" }}
      />
      <span aria-hidden className="vinyl anim-spin-slow absolute rounded-full" style={{ width: "100%", height: "100%" }} />
      <span aria-hidden className="vinyl-shine anim-spin-slow absolute rounded-full" style={{ width: "100%", height: "100%" }} />
      {/* lime centre label with the Muse mark */}
      <span
        aria-hidden
        className="absolute grid place-items-center rounded-full bg-lime border-[3px] border-ink"
        style={{ width: "34%", height: "34%" }}
      >
        <svg viewBox="0 0 48 48" style={{ width: "62%", height: "62%" }}>
          <path
            d="M12 35V17l12 12 12-12v18"
            fill="none"
            stroke="#0E0F0C"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="13" r="3.6" fill="#0E0F0C" />
        </svg>
        <span className="absolute h-2 w-2 rounded-full bg-ink" />
      </span>
    </div>
  );
}

/* ================= Skeleton / Empty / Error ================= */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-2xl bg-raise", className)} />;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-3 rounded-[28px] border-2 border-dashed border-fieldline px-6 py-14 text-center">
      {icon && <div className="text-accent">{icon}</div>}
      <p className="font-bagel text-2xl text-tx">{title}</p>
      {body && <p className="max-w-md text-sm text-tx2">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something tripped",
  body,
  onRetry,
  retryLabel = "Try again",
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="grid place-items-center gap-3 rounded-[28px] border-2 border-dashed border-accent-2/60 bg-deep px-6 py-10 text-center"
    >
      <p className="font-bagel text-2xl text-accent-2">{title}</p>
      {body && <p className="max-w-md text-sm text-tx/80">{body}</p>}
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-1">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

/* ================= Spinner ================= */

export function Spinner({ label = "Working", className }: { label?: string; className?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex", className)}>
      <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-current border-t-transparent" />
    </span>
  );
}
