import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/primitives";

export const metadata: Metadata = { title: "Privacy" };

const SECTIONS = [
  {
    h: "What Muse stores",
    p: "Your account (email, display name, preferences), your conversations, playlists, recommendation feedback, and creator studio content. Nothing else. We don't track you around the web and we don't sell data to anyone.",
  },
  {
    h: "What we never do",
    p: "We never put sensitive personal information into AI prompts or logs. Passwords are stored only as salted hashes. API keys and provider credentials stay server-side and are never sent to your browser.",
  },
  {
    h: "Data retention",
    p: "Conversations are kept until you delete them — one by one in History, or all at once in Settings. Recommendation feedback stays until you delete your account. When you delete your account, every row that belongs to you (profile, sessions, messages, playlists, feedback, plans) is removed immediately and permanently.",
  },
  {
    h: "Your controls",
    p: "Playlists are private by default and only become visible to others if you mark one public. In Settings you can edit or clear your preferences, delete all conversations, or delete your entire account at any time.",
  },
  {
    h: "Music platforms",
    p: "When you open a track, you leave Muse and become subject to that platform's own privacy policy. Muse is a companion, not a streaming service.",
  },
];

export default function PrivacyPage() {
  return (
    <div id="main" className="mx-auto max-w-3xl px-7 py-10">
      <Link href="/" aria-label="Muse home" className="inline-block rounded-full">
        <Logo size={36} />
      </Link>
      <h1 className="mt-10 font-bagel text-5xl text-tx">Privacy, in plain words.</h1>
      <p className="mt-3 text-tx2">Short version: your data is yours, and deleting it really deletes it.</p>
      <div className="mt-10 grid gap-6">
        {SECTIONS.map((s) => (
          <section key={s.h} className="rounded-3xl border-2 border-card-line bg-surf p-6 text-tx">
            <h2 className="font-bagel text-2xl text-accent">{s.h}</h2>
            <p className="mt-2 leading-relaxed text-tx/85">{s.p}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm text-tx2">
        Questions about this policy?{" "}
        <Link href="/" className="font-semibold text-accent hover:underline">
          Head home
        </Link>{" "}
        or read the{" "}
        <Link href="/terms" className="font-semibold text-accent hover:underline">
          Terms
        </Link>
        .
      </p>
    </div>
  );
}
