"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Equalizer, Record, Sticker } from "@/components/primitives";

const CHIPS = [
  "Smooth songs for a night drive",
  "Alté vibes from smaller artists",
  "Music for an owambe",
  "Wetin dey sweet for Sunday?",
];

export function Hero() {
  const [query, setQuery] = useState("");

  return (
    <section className="mx-auto grid max-w-[1240px] items-center gap-14 px-7 pb-20 pt-14 lg:grid-cols-2 lg:gap-8 lg:pt-20">
      {/* Left: headline + ask bar */}
      <div>
        <h1
          className="font-bagel leading-[0.94] tracking-tight"
          style={{ fontSize: "clamp(54px, 9.2vw, 118px)" }}
        >
          <span className="anim-rise block text-tx">Your sound.</span>
          <span className="anim-rise block text-lime" style={{ animationDelay: "0.12s" }}>
            Your <span className="wavy">culture.</span>
          </span>
          <span className="anim-rise mt-1 flex items-center gap-4 text-tx" style={{ animationDelay: "0.24s" }}>
            Your
            <span className="inline-block -rotate-3 rounded-2xl border-[3px] border-ink bg-lime px-4 py-0.5 text-ink shadow-[5px_5px_0_var(--shadow)]">
              AI.
            </span>
          </span>
        </h1>
        <p className="anim-rise mt-6 max-w-xl text-lg leading-relaxed text-tx2" style={{ animationDelay: "0.34s" }}>
          Tell Muse the mood, the moment or the madness. Ask in English or Pidgin. Muse finds real
          songs, builds your playlist and helps artists plan the next release.
        </p>

        {/* Ask bar */}
        <form
          className="anim-rise mt-8 flex max-w-xl items-center gap-2 rounded-full border-2 border-[#4A4D40] bg-surf p-2 pl-6 shadow-[6px_6px_0_#C8FF2E]"
          style={{ animationDelay: "0.44s" }}
          action="/signup"
        >
          <label htmlFor="hero-ask" className="sr-only">
            Ask Muse for music
          </label>
          <input
            id="hero-ask"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Smooth songs for a night drive..."
            className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-cream placeholder:text-dim focus:outline-none"
          />
          <Link
            href={{ pathname: "/signup", query: query ? { q: query } : {} }}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-lime px-5 font-semibold text-ink transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
          >
            Ask Muse <ArrowRight size={18} aria-hidden />
          </Link>
        </form>
        <div className="anim-rise mt-4 flex max-w-xl flex-wrap gap-2" style={{ animationDelay: "0.54s" }}>
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setQuery(c)}
              className="min-h-11 cursor-pointer rounded-full border-2 border-fieldline px-4 py-1.5 text-sm text-tx2 transition-all hover:-translate-y-0.5 hover:border-lime hover:text-lime"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Right: record art */}
      <div className="relative mx-auto w-full max-w-[520px]" aria-hidden={false}>
        <div className="anim-float relative mx-auto w-fit" style={{ ["--rot" as string]: "0deg" }}>
          <Record size={380} className="max-w-full" />
          <div className="absolute -left-6 top-4 lg:-left-12">
            <Sticker color="lime" rotate={-6}>Pidgin-ready</Sticker>
          </div>
          <div className="absolute -right-2 top-20 lg:-right-8">
            <Sticker color="cream" rotate={5}>Alté</Sticker>
          </div>
          <div className="absolute bottom-8 right-2 lg:-right-4">
            <Sticker color="pink" rotate={-4}>Owambe mode</Sticker>
          </div>
        </div>
        <Equalizer bars={28} className="mx-auto mt-10 justify-center" label="Animated equalizer bars" />
      </div>
    </section>
  );
}
