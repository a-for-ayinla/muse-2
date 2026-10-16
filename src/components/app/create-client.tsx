"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2, Wand2 } from "lucide-react";
import { brand } from "@/config/brand";
import {
  Button,
  Chip,
  Field,
  Input,
  ModeToggle,
  Select,
  Spinner,
  Sticker,
  Textarea,
} from "@/components/primitives";
import { Dialog } from "@/components/dialog";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";

type ChecklistItem = { id: string; label: string; done: boolean };
type Plan = {
  kind: string;
  summary: string;
  positioning: { sound: string; audience: string; angle: string } | null;
  releaseChecklist: ChecklistItem[];
  contentIdeas: ChecklistItem[];
  promoChecklist: ChecklistItem[];
  similarArtists: string[];
  note: string;
};
type SavedPlan = {
  id: string;
  title: string;
  planType: string;
  inputs: Record<string, unknown>;
  plan: Plan;
  createdAt: string;
  updatedAt: string;
};
type Profile = {
  artistName: string;
  bio: string;
  genres: string[];
  influences: string[];
  targetAudience: string;
  goals: string;
} | null;

const PLAN_TYPES = [
  { id: "full", label: "Full campaign" },
  { id: "positioning", label: "Positioning" },
  { id: "release", label: "Release checklist" },
  { id: "content", label: "Content ideas" },
  { id: "promo", label: "Promo plan" },
];

export function CreateClient({
  provider,
  initialProfile,
  initialPlans,
}: {
  provider: { isDemo: boolean; configured: boolean };
  initialProfile: Profile;
  initialPlans: SavedPlan[];
}) {
  const router = useRouter();
  const { push } = useToast();

  // ---- profile state ----
  const [artistName, setArtistName] = useState(initialProfile?.artistName ?? "");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [genres, setGenres] = useState<string[]>(initialProfile?.genres ?? []);
  const [influences, setInfluences] = useState((initialProfile?.influences ?? []).join(", "));
  const [audience, setAudience] = useState(initialProfile?.targetAudience ?? "");
  const [goals, setGoals] = useState(initialProfile?.goals ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // ---- generator state ----
  const [planType, setPlanType] = useState("full");
  const [generating, setGenerating] = useState(false);

  // ---- plans state ----
  const [plans, setPlans] = useState<SavedPlan[]>(initialPlans);
  const [openPlan, setOpenPlan] = useState<SavedPlan | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggleGenre = (g: string) =>
    setGenres((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g].slice(0, 6)));

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      const res = await fetch("/api/creators/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          artistName: artistName.trim(),
          bio: bio.trim(),
          genres,
          influences: influences.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8),
          targetAudience: audience.trim(),
          goals: goals.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error?.message ?? "Could not save profile.");
      push("success", "Artist profile saved.");
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function generate() {
    if (generating) return;
    if (!artistName.trim() && genres.length === 0) {
      push("error", "Add your artist name or at least one genre first.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/creators/plans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          planType,
          artistName: artistName.trim(),
          genres,
          influences: influences.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8),
          targetAudience: audience.trim(),
          goals: goals.trim(),
          bio: bio.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error?.message ?? "Plan generation failed.");
      const saved: SavedPlan = {
        id: data.data.plan.id,
        title: data.data.plan.title,
        planType: data.data.plan.planType,
        inputs: data.data.plan.inputs,
        plan: data.data.plan.plan,
        createdAt: data.data.plan.createdAt,
        updatedAt: data.data.plan.updatedAt,
      };
      setPlans((ps) => [saved, ...ps]);
      setOpenPlan(saved);
      push("success", "Plan drafted — remember, it's a suggestion.");
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Plan generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function patchPlan(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/creators/plans/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data?.error?.message ?? "Could not update plan.");
    const updated: SavedPlan = {
      ...data.data.plan,
      plan: data.data.plan.plan,
      inputs: data.data.plan.inputs,
      createdAt: data.data.plan.createdAt,
      updatedAt: data.data.plan.updatedAt,
    };
    setPlans((ps) => ps.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    setOpenPlan((p) => (p && p.id === id ? { ...p, ...updated } : p));
    return updated;
  }

  async function toggleItem(section: "releaseChecklist" | "contentIdeas" | "promoChecklist", itemId: string) {
    if (!openPlan || busy) return;
    setBusy(true);
    const next: Plan = {
      ...openPlan.plan,
      [section]: openPlan.plan[section].map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)),
    };
    setOpenPlan({ ...openPlan, plan: next });
    try {
      await patchPlan(openPlan.id, { plan: next });
    } catch (e) {
      push("error", e instanceof Error ? e.message : "Could not save checklist.");
    } finally {
      setBusy(false);
    }
  }

  async function deletePlan(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/creators/plans/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? "Could not delete.");
      setPlans((ps) => ps.filter((p) => p.id !== id));
      setDeleting(null);
      if (openPlan?.id === id) setOpenPlan(null);
      push("success", "Plan deleted.");
    } catch (e) {
      push("error", e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  }

  async function submitRename(id: string) {
    const title = renameValue.trim();
    if (!title) return;
    try {
      await patchPlan(id, { title });
      setRenaming(null);
      push("success", "Plan renamed.");
    } catch (e) {
      push("error", e instanceof Error ? e.message : "Could not rename.");
    }
  }

  const checklist = (title: string, section: "releaseChecklist" | "contentIdeas" | "promoChecklist") => {
    const items = openPlan?.plan[section] ?? [];
    if (!items.length) return null;
    return (
      <div>
        <p className="font-bagel text-lg text-accent">{title}</p>
        <ul className="mt-2 grid gap-1">
          {items.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                aria-pressed={i.done}
                disabled={busy}
                onClick={() => void toggleItem(section, i.id)}
                className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-2 text-left text-sm text-tx/90 transition-colors hover:bg-raise"
              >
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-ink transition-colors",
                    i.done ? "bg-lime text-ink" : "bg-transparent text-transparent",
                  )}
                >
                  <Check size={13} strokeWidth={3.5} aria-hidden />
                </span>
                <span className={cn(i.done && "line-through opacity-60")}>{i.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-bagel text-4xl text-tx">Creator studio.</h1>
          <p className="text-tx2">Shape your sound and your rollout. Everything here is a suggestion to test.</p>
        </div>
        <ModeToggle
          value="create"
          onChange={(v) => v === "listen" && router.push("/listen")}
          label="Switch between Listen and Create modes"
        />
      </div>

      {provider.isDemo && (
        <div role="note" className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-accent/70 bg-surf px-4 py-3 text-sm text-tx">
          <Sticker color="lime" rotate={-2} className="shrink-0 text-xs">Demo data</Sticker>
          <span className="text-tx/85">Similar artists come from a fictional sample catalog.</span>
        </div>
      )}

      {/* ---- Profile editor ---- */}
      <form onSubmit={saveProfile} className="grid gap-5 rounded-[32px] border-2 border-card-line bg-surf p-6 text-tx shadow-[8px_8px_0_var(--raise)] md:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bagel text-2xl">Your artist profile</h2>
          <Sticker color="cream" rotate={2} className="text-xs">Your facts</Sticker>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Artist name" htmlFor="cp-name">
            <Input id="cp-name" value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="e.g. Temi West" maxLength={80} />
          </Field>
          <Field label="Influences (comma separated)" htmlFor="cp-infl">
            <Input id="cp-infl" value={influences} onChange={(e) => setInfluences(e.target.value)} placeholder="e.g. silky RnB, street percussion" />
          </Field>
        </div>
        <Field label="Describe your sound" htmlFor="cp-bio">
          <Textarea id="cp-bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} placeholder="What does your music feel like at 1am on the Third Mainland Bridge?" />
        </Field>
        <div className="grid gap-2">
          <span className="text-sm font-semibold">Your genres</span>
          <div className="flex flex-wrap gap-2">
            {brand.genres.map((g) => (
              <Chip key={g} active={genres.includes(g)} onClick={() => toggleGenre(g)}>{g}</Chip>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Who is it for?" htmlFor="cp-aud">
            <Input id="cp-aud" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. alté kids who hate small talk" maxLength={300} />
          </Field>
          <Field label="Goals for the next 6 months" htmlFor="cp-goals">
            <Input id="cp-goals" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="e.g. drop two singles, grow real listeners" maxLength={500} />
          </Field>
        </div>
        <div>
          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? <Spinner label="Saving profile" /> : "Save profile"}
          </Button>
        </div>
      </form>

      {/* ---- Generator ---- */}
      <section className="grid gap-5 rounded-[32px] border-2 border-card-line bg-deep p-6 text-tx shadow-[10px_10px_0_var(--raise)] md:p-8" aria-label="Plan generator">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bagel text-2xl">Draft my next move</h2>
          <Sticker color="pink" rotate={-2} className="text-xs">Suggestion, not fact</Sticker>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="plan-type" className="text-sm font-semibold">Plan type</label>
            <Select id="plan-type" value={planType} onChange={(e) => setPlanType(e.target.value)}>
              {PLAN_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </Select>
          </div>
          <Button onClick={() => void generate()} disabled={generating}>
            {generating ? <Spinner label="Generating plan" /> : (<><Wand2 size={18} aria-hidden /> Generate plan</>)}
          </Button>
        </div>
        <p className="text-sm text-muted">
          Built from your profile. Muse never invents streams, chart positions or audience numbers.
        </p>
      </section>

      {/* ---- Open plan ---- */}
      {openPlan && (
        <section className="grid gap-6 rounded-[32px] border-2 border-ink bg-cream p-6 text-ink shadow-[10px_10px_0_var(--raise)] md:p-8" aria-label={`Plan: ${openPlan.title}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bagel text-2xl">{openPlan.title}</p>
              <p className="text-sm text-tx2">{openPlan.plan.summary}</p>
            </div>
            <Sticker color="pink" rotate={2} className="text-xs">Suggestion</Sticker>
          </div>

          {openPlan.plan.positioning && (
            <div className="rounded-3xl border-2 border-inner-line bg-surf p-5 text-tx">
              <p className="font-bagel text-lg text-accent">Positioning suggestion</p>
              <dl className="mt-2 grid gap-2 text-sm text-tx/90">
                <div><dt className="inline font-semibold">Sound: </dt><dd className="inline">{openPlan.plan.positioning.sound}</dd></div>
                <div><dt className="inline font-semibold">Audience: </dt><dd className="inline">{openPlan.plan.positioning.audience}</dd></div>
                <div><dt className="inline font-semibold">Angle: </dt><dd className="inline">{openPlan.plan.positioning.angle}</dd></div>
              </dl>
            </div>
          )}

          <div className="grid gap-6 rounded-3xl border-2 border-inner-line bg-surf p-5 text-tx md:grid-cols-2">
            {checklist("Release checklist", "releaseChecklist")}
            {checklist("Content ideas", "contentIdeas")}
            {checklist("Promo checklist", "promoChecklist")}
            {openPlan.plan.similarArtists.length > 0 && (
              <div>
                <p className="font-bagel text-lg text-accent">Catalog artists in your lane</p>
                <p className="mt-1 text-xs text-dim">From catalog evidence only{provider.isDemo ? " (fictional demo names)" : ""}.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {openPlan.plan.similarArtists.map((a) => (
                    <span key={a} className="rounded-full border-2 border-line px-3 py-1.5 text-sm text-tx/85">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-tx2">{openPlan.plan.note}</p>
        </section>
      )}

      {/* ---- Saved plans ---- */}
      <section aria-label="Saved plans">
        <h2 className="font-bagel text-2xl text-tx">Saved plans</h2>
        {plans.length === 0 ? (
          <div className="mt-4 grid place-items-center gap-3 rounded-[28px] border-2 border-dashed border-fieldline px-6 py-12 text-center">
            <p className="font-bagel text-2xl text-tx">No plans yet</p>
            <p className="max-w-md text-sm text-tx2">Fill your profile and generate your first draft — tick items off as you execute.</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3">
            {plans.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-3xl border-2 border-card-line bg-surf p-4 text-tx transition-colors hover:border-accent/50"
              >
                <button
                  type="button"
                  onClick={() => setOpenPlan(p)}
                  className="min-w-0 flex-1 cursor-pointer text-left"
                >
                  <p className="truncate font-semibold">{p.title}</p>
                  <p className="text-xs text-dim">
                    {p.planType} · updated {new Date(p.updatedAt).toLocaleDateString()}
                  </p>
                </button>
                <div className="flex items-center gap-1.5">
                  <button type="button" aria-label={`Open ${p.title}`} onClick={() => setOpenPlan(p)} className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-raise hover:text-accent">
                    <Plus size={19} aria-hidden />
                  </button>
                  <button type="button" aria-label={`Rename ${p.title}`} onClick={() => { setRenaming(p.id); setRenameValue(p.title); }} className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-raise hover:text-accent">
                    <Pencil size={18} aria-hidden />
                  </button>
                  <button type="button" aria-label={`Delete ${p.title}`} onClick={() => setDeleting(p.id)} className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-raise hover:text-accent-2">
                    <Trash2 size={18} aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Rename dialog */}
      <Dialog open={!!renaming} onClose={() => setRenaming(null)} title="Rename plan">
        <div className="grid gap-4">
          <Field label="Plan title" htmlFor="rename-plan">
            <Input id="rename-plan" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} maxLength={100} />
          </Field>
          <Button onClick={() => renaming && void submitRename(renaming)} disabled={!renameValue.trim()}>
            Save name
          </Button>
        </div>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete plan?">
        <div className="grid gap-4">
          <p className="text-sm text-tx/85">This plan will be permanently deleted. No undo.</p>
          <div className="flex gap-3">
            <Button variant="danger" disabled={busy} onClick={() => deleting && void deletePlan(deleting)}>
              {busy ? <Spinner label="Deleting" /> : "Delete it"}
            </Button>
            <Button variant="ghost" onClick={() => setDeleting(null)} className="text-tx/70">Keep it</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
