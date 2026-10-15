"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { brand } from "@/config/brand";
import { Button, Chip, Input, Select, Spinner } from "@/components/primitives";
import { useToast } from "@/components/toast";
import type { ShellUser } from "./shell";

/** First-login onboarding: fills the profile, then steps aside. */
export function OnboardingGate({ user }: { user: ShellUser }) {
  const router = useRouter();
  const { push } = useToast();
  const [name, setName] = useState(user.displayName || "");
  const [role, setRole] = useState<"listener" | "creator">("listener");
  const [language, setLanguage] = useState(user.preferredLanguage || "English");
  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [platform, setPlatform] = useState("any");
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const toggle = (list: string[], v: string, set: (x: string[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v].slice(0, 8));

  async function save(skip = false) {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          skip
            ? { onboardingCompleted: true }
            : {
                displayName: name.trim() || user.displayName || "Muse listener",
                role,
                preferredLanguage: language,
                genres,
                moods,
                preferredPlatform: platform,
                onboardingCompleted: true,
              },
        ),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error?.message ?? "Could not save.");
      push("success", skip ? "Onboarding skipped — you can set preferences in Settings." : "You're set. Ask Muse anything.");
      router.refresh();
    } catch (e) {
      push("error", e instanceof Error ? e.message : "Could not save your profile.");
      setSaving(false);
    }
  }

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/85 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Muse — set up your profile"
        className="my-8 w-full max-w-2xl rounded-[32px] border-2 border-[#2A2D23] bg-surf p-6 text-cream shadow-[10px_10px_0_var(--raise)] anim-rise md:p-9"
      >
        <p className="font-bagel text-3xl">
          First things first, <span className="text-lime">{user.displayName || "friend"}</span>.
        </p>
        <p className="mt-2 text-sm text-muted">
          Thirty seconds so Muse understands your ear. Everything is editable later in Settings.
        </p>

        <div className="mt-6 grid gap-5">
          <div className="grid gap-1.5">
            <label htmlFor="ob-name" className="text-sm font-semibold">
              Display name
            </label>
            <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </div>

          <div className="grid gap-1.5">
            <span className="text-sm font-semibold">You are here mostly as a…</span>
            <div className="flex gap-2">
              <Chip active={role === "listener"} onClick={() => setRole("listener")}>Listener</Chip>
              <Chip active={role === "creator"} onClick={() => setRole("creator")}>Artist / Creator</Chip>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="ob-lang" className="text-sm font-semibold">
                Preferred language
              </label>
              <Select id="ob-lang" value={language} onChange={(e) => setLanguage(e.target.value)}>
                {brand.languages.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </Select>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="ob-platform" className="text-sm font-semibold">
                Where you press play
              </label>
              <Select id="ob-platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {brand.platforms.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-semibold">Genres you live in</span>
            <div className="flex flex-wrap gap-2">
              {brand.genres.map((g) => (
                <Chip key={g} active={genres.includes(g)} onClick={() => toggle(genres, g, setGenres)}>
                  {g}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-semibold">Moods you chase</span>
            <div className="flex flex-wrap gap-2">
              {brand.moods.map((m) => (
                <Chip key={m} active={moods.includes(m)} onClick={() => toggle(moods, m, setMoods)}>
                  {m}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button onClick={() => save(false)} disabled={saving}>
            {saving ? <Spinner label="Saving" /> : "Save and start"}
          </Button>
          <Button variant="ghost" onClick={() => { setDismissed(true); void save(true); }} disabled={saving}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
