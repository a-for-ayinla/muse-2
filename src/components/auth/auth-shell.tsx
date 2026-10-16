import Link from "next/link";
import { Equalizer, Logo, Record } from "@/components/primitives";
import { ThemeToggle } from "@/components/theme-toggle";

/** Two-column auth shell: form left, animated record art right (stacks on mobile). */
export function AuthShell({
  title,
  subtitle,
  children,
  art = "record",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  art?: "record" | "equalizer";
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2" id="main">
      <div className="flex flex-col px-7 py-8">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Back to Muse home" className="rounded-full">
            <Logo size={36} />
          </Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <h1 className="font-bagel text-4xl text-tx">{title}</h1>
          <p className="mt-2 text-tx2">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div
        aria-hidden
        className="relative hidden items-center justify-center overflow-hidden border-l-2 border-line/40 bg-deep lg:flex"
      >
        {art === "record" ? (
          <div className="anim-float">
            <Record size={380} />
          </div>
        ) : (
          <Equalizer bars={28} className="h-64" />
        )}
        <div className="absolute bottom-10 left-0 right-0 text-center">
          <p className="font-bagel text-xl text-tx/70">your sound. your culture. your ai.</p>
        </div>
      </div>
    </div>
  );
}
