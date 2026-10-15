"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Heart } from "lucide-react";
import { brand } from "@/config/brand";
import { Chip, Equalizer, Logo, ModeToggle, Sticker } from "@/components/primitives";
import { ArtTile } from "@/components/track-card";
import { cn } from "@/lib/cn";

/* ---------------- Ticker ---------------- */

export function Ticker() {
  const items = [...brand.genres, ...brand.genres];
  return (
    <div aria-hidden="true" className="overflow-hidden py-6">
      <div className="-rotate-[1.4deg] border-y-[3px] border-ink bg-lime py-3 shadow-[0_4px_0_var(--raise)]">
        <div className="anim-marquee flex w-max items-center gap-8 whitespace-nowrap px-4">
          {items.map((g, i) => (
            <span key={i} className="flex items-center gap-8 font-bagel text-2xl text-ink">
              {g}
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-ink" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Two modes ---------------- */

function ChatBubble({ from, children }: { from: "user" | "muse"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "max-w-[92%] rounded-3xl border-2 px-4 py-3 text-[15px] leading-relaxed",
        from === "user"
          ? "ml-auto rounded-br-lg border-ink bg-lime text-ink shadow-[3px_3px_0_var(--shadow)]"
          : "rounded-bl-lg border-[#34372C] bg-raise text-cream",
      )}
    >
      {children}
    </div>
  );
}

const SAMPLE_TRACKS = [
  { title: "Third Mainland Hours", tone: 0 },
  { title: "Slow Lane, Lekki", tone: 1 },
  { title: "Streetlight Sermon", tone: 2 },
  { title: "Bridge Lights", tone: 3 },
];

function ListenDemo() {
  const [hearts, setHearts] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState(false);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <ChatBubble from="user">Give me smooth Nigerian songs for a night drive.</ChatBubble>
        <ChatBubble from="muse">
          Found four mellow picks in the catalog. Easy tempo, warm bass and room to think on an
          empty road.
          <span className="mt-2 block">
            <Sticker color="cream" rotate={-2} className="text-xs">
              Sample layout
            </Sticker>
          </span>
        </ChatBubble>
        <p className="text-xs leading-relaxed text-dim">
          Real results come from your connected music catalog. Every track opens on its own page in
          the app you already use.
        </p>
      </div>
      <div className="grid gap-2.5">
        {SAMPLE_TRACKS.map((t, i) => (
          <div
            key={t.title}
            className="flex items-center gap-3 rounded-2xl border-2 border-[#2A2D23] bg-surf p-2.5"
          >
            <ArtTile title={t.title} size={48} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-cream">{t.title}</p>
              <p className="text-xs text-dim">Artist name</p>
            </div>
            <button
              type="button"
              aria-label={`Like sample track ${t.title}`}
              aria-pressed={!!hearts[i]}
              onClick={() => setHearts((h) => ({ ...h, [i]: !h[i] }))}
              className={cn(
                "grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-raise",
                hearts[i] ? "text-pink" : "text-muted hover:text-pink",
              )}
            >
              <Heart size={19} aria-hidden className={cn(hearts[i] && "fill-pink anim-pop")} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className={cn(
            "mt-1 min-h-11 cursor-pointer rounded-full border-2 font-semibold transition-all",
            saved
              ? "border-ink bg-lime text-ink shadow-[4px_4px_0_var(--shadow)]"
              : "border-cream/40 text-cream hover:-translate-y-0.5 hover:border-lime hover:text-lime",
          )}
        >
          {saved ? "✓ Saved to Playlists" : "Save as playlist"}
        </button>
      </div>
    </div>
  );
}

const CHECKLIST = [
  "Finish artwork and credits",
  "Pick a release date and tell your circle",
  "Cut three teaser clips",
  "Send the track to five playlist curators",
];

function CreateDemo() {
  const [ticks, setTicks] = useState<Record<number, boolean>>({});
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <ChatBubble from="user">Help me describe my sound as an emerging Afrobeats artist.</ChatBubble>
        <ChatBubble from="muse">
          Here is a first draft to react to. Change anything, save it, then ask for a release
          checklist.
          <span className="mt-2 block">
            <Sticker color="pink" rotate={2} className="text-xs">
              Suggestion, not fact
            </Sticker>
          </span>
        </ChatBubble>
        <p className="text-xs leading-relaxed text-dim">
          Muse never invents streams, chart positions or audience numbers. You bring the facts, Muse
          helps shape the plan.
        </p>
      </div>
      <div className="grid content-start gap-4">
        <div className="rounded-3xl border-2 border-[#2A2D23] bg-surf p-4">
          <p className="mb-2 font-bagel text-lg text-lime">Positioning suggestion</p>
          <dl className="grid gap-2 text-sm text-cream/90">
            <div>
              <dt className="inline font-semibold text-cream">Sound: </dt>
              <dd className="inline">late-night Afrobeats with alté textures.</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-cream">Audience: </dt>
              <dd className="inline">city twenty-somethings who find music after midnight.</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-cream">Angle: </dt>
              <dd className="inline">the voice of the ride home after the party.</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-3xl border-2 border-[#2A2D23] bg-surf p-4">
          <p className="mb-2 font-bagel text-lg text-lime">Release checklist, draft</p>
          <ul className="grid gap-1.5">
            {CHECKLIST.map((c, i) => (
              <li key={c}>
                <button
                  type="button"
                  aria-pressed={!!ticks[i]}
                  onClick={() => setTicks((t) => ({ ...t, [i]: !t[i] }))}
                  className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-2 text-left text-sm text-cream/90 transition-colors hover:bg-raise"
                >
                  <span
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-ink transition-colors",
                      ticks[i] ? "bg-lime text-ink" : "bg-transparent text-transparent",
                    )}
                  >
                    <Check size={13} strokeWidth={3.5} aria-hidden />
                  </span>
                  <span className={cn(ticks[i] && "line-through opacity-60")}>{c}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function TwoModes() {
  const [mode, setMode] = useState<"listen" | "create">("listen");
  return (
    <section className="mx-auto max-w-[1240px] px-7 py-20" id="listen">
      <p className="text-center font-semibold uppercase tracking-[0.25em] text-lime">
        Two modes, one Muse
      </p>
      <h2 className="mt-3 text-center font-bagel text-5xl text-tx md:text-6xl">
        Pick your side of the speaker.
      </h2>
      <div className="mt-8 flex justify-center" id="create">
        <ModeToggle value={mode} onChange={setMode} label="Landing demo mode" />
      </div>
      <div className="mt-10 rounded-[32px] border-2 border-[#2A2D23] bg-deep p-6 text-cream shadow-[10px_10px_0_var(--raise)] md:p-10">
        {mode === "listen" ? <ListenDemo /> : <CreateDemo />}
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */

const STEPS = [
  { n: 1, title: "Say the vibe", body: "Type the mood, the moment or the occasion — English or Pidgin, both work." },
  { n: 2, title: "Muse checks the catalog", body: "It searches the connected music catalog and only returns songs that really exist." },
  { n: 3, title: "Save it, then play it", body: "Keep the picks as a playlist here, then press play on the platform you already use." },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-[1240px] px-7 py-16" id="how">
      <h2 className="text-center font-bagel text-5xl text-tx md:text-6xl">
        From a mood to a playlist in three steps.
      </h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-[28px] border-2 border-[#2A2D23] bg-surf p-7 text-cream shadow-[8px_8px_0_var(--raise)] transition-transform hover:-translate-y-1"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-ink bg-lime font-bagel text-2xl text-ink">
              {s.n}
            </span>
            <h3 className="mt-5 font-bagel text-2xl">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Why Muse ---------------- */

const PIDGIN_PILLS = ["Wetin dey sweet for night?", "Owambe playlist abeg", "Chill songs for Sunday"];
const CHECKS = [
  { title: "Grounded in real results", body: "Every recommendation traces back to a catalog row you can open." },
  { title: "Not another streaming app", body: "Muse sends you to the platform you already pay for — no lock-in." },
  { title: "Private until you share", body: "Playlists are private by default. Your taste stays your business." },
];

export function WhyMuse() {
  return (
    <section className="mx-auto max-w-[1240px] px-7 py-20" id="why">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-bagel text-5xl leading-tight text-tx md:text-6xl">
            Muse never makes up a song.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-tx2">
            Most AI will happily invent a hit that does not exist. Muse only recommends tracks it
            actually found, so every pick is something you can press play on.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {PIDGIN_PILLS.map((p, i) => (
              <span
                key={p}
                className="rounded-full border-2 border-dashed border-lime/70 px-4 py-2 text-sm font-medium text-tx"
                style={{ transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)` }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
        <ul className="grid gap-4">
          {CHECKS.map((c) => (
            <li
              key={c.title}
              className="flex items-start gap-4 rounded-3xl border-2 border-[#2A2D23] bg-surf p-5 text-cream"
            >
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-lime text-ink">
                <Check size={18} strokeWidth={3.5} aria-hidden />
              </span>
              <div>
                <p className="font-bagel text-xl">{c.title}</p>
                <p className="mt-1 text-sm text-muted">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */

export function CtaBlock() {
  return (
    <section className="mx-auto max-w-[1240px] px-7 pb-24 pt-8">
      <div className="relative overflow-hidden rounded-[40px] border-[3px] border-ink bg-lime p-10 text-ink shadow-[10px_10px_0_var(--shadow)] md:p-16">
        <div className="relative z-10 max-w-2xl">
          <h2 className="font-bagel text-5xl leading-tight md:text-7xl">Start with a vibe.</h2>
          <p className="mt-4 text-lg font-medium">
            Make a free account and ask for the first song of the night.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-8 py-3 font-semibold text-cream shadow-[5px_5px_0_#FF6B9A] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#FF6B9A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#FF6B9A]"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-full border-[3px] border-ink px-8 py-3 font-semibold text-ink transition-all hover:-translate-y-0.5 hover:bg-ink hover:text-cream"
            >
              Log in
            </Link>
          </div>
        </div>
        <Equalizer
          bars={18}
          colors={["#0E0F0C"]}
          className="absolute -right-2 bottom-0 hidden h-40 md:flex"
          label="Decorative equalizer bars"
        />
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */

export function LandingFooter() {
  return (
    <footer className="border-t-2 border-line/40">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-7 py-14 md:grid-cols-[auto_1fr_auto]">
        <Link href="/" aria-label="Muse home" className="rounded-full">
          <Logo size={36} />
        </Link>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-tx2">
          <a href="#listen" className="rounded hover:text-lime">Listen</a>
          <a href="#create" className="rounded hover:text-lime">Create</a>
          <a href="#how" className="rounded hover:text-lime">How it works</a>
          <a href="#why" className="rounded hover:text-lime">Why Muse</a>
          <Link href="/privacy" className="rounded hover:text-lime">Privacy</Link>
          <Link href="/terms" className="rounded hover:text-lime">Terms</Link>
        </nav>
        <div className="flex gap-2">
          <Chip onClick={() => window.scrollTo({ top: 0 })}>Back up ↑</Chip>
        </div>
      </div>
      <div className="mx-auto max-w-[1240px] px-7 pb-12">
        <p className="max-w-3xl border-t-2 border-line/40 pt-8 text-sm leading-relaxed text-tx2">
          {brand.disclaimer}
        </p>
      </div>
    </footer>
  );
}
