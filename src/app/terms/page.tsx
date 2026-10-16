import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/primitives";

export const metadata: Metadata = { title: "Terms" };

const SECTIONS = [
  {
    h: "What Muse is",
    p: "Muse is a music companion: conversational discovery grounded in a connected catalog, playlist saving, and a creator studio for independent artists. It is not a streaming service and does not play audio. Tracks open on the music platform you choose.",
  },
  {
    h: "Honest AI",
    p: "Recommendations come only from catalog search results. If no catalog is connected, Muse says so instead of inventing songs. Creator studio output is labelled as suggestions — ideas to test, not predictions, and never invented statistics.",
  },
  {
    h: "Your account",
    p: "You're responsible for your password and for activity on your account. Don't use Muse to break the law, spam, scrape music platforms, or misrepresent AI-generated suggestions as verified facts.",
  },
  {
    h: "Music rights",
    p: "Track metadata, artwork and previews belong to their respective providers and rights holders and appear only where the provider permits. Demo mode shows clearly fictional sample data; it represents no real artist.",
  },
  {
    h: "Changes",
    p: "Muse is an evolving MVP. Features may change; if we change how your data is handled, the Privacy page changes first.",
  },
];

export default function TermsPage() {
  return (
    <div id="main" className="mx-auto max-w-3xl px-7 py-10">
      <Link href="/" aria-label="Muse home" className="inline-block rounded-full">
        <Logo size={36} />
      </Link>
      <h1 className="mt-10 font-bagel text-5xl text-tx">Terms, kept simple.</h1>
      <p className="mt-3 text-tx2">The rules of the road for using Muse.</p>
      <div className="mt-10 grid gap-6">
        {SECTIONS.map((s) => (
          <section key={s.h} className="rounded-3xl border-2 border-card-line bg-surf p-6 text-tx">
            <h2 className="font-bagel text-2xl text-accent">{s.h}</h2>
            <p className="mt-2 leading-relaxed text-tx/85">{s.p}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm text-tx2">
        Also read{" "}
        <Link href="/privacy" className="font-semibold text-accent hover:underline">
          Privacy
        </Link>{" "}
        for how your data is handled.
      </p>
    </div>
  );
}
