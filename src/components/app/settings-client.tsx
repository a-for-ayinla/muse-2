"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { brand } from "@/config/brand";
import { Button, Chip, Field, Input, Select, Spinner } from "@/components/primitives";
import { Dialog } from "@/components/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/components/toast";

type User = {
  email: string;
  displayName: string;
  role: string;
  preferredLanguage: string;
  genres: string[];
  moods: string[];
  preferredPlatform: string;
};

export function SettingsClient({ user }: { user: User }) {
  const router = useRouter();
  const { push } = useToast();
  const [name, setName] = useState(user.displayName);
  const [role, setRole] = useState(user.role);
  const [language, setLanguage] = useState(user.preferredLanguage);
  const [genres, setGenres] = useState<string[]>(user.genres);
  const [moods, setMoods] = useState<string[]>(user.moods);
  const [platform, setPlatform] = useState(user.preferredPlatform);
  const [saving, setSaving] = useState(false);
  const [confirmChats, setConfirmChats] = useState(false);
  const [confirmAccount, setConfirmAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (list: string[], v: string, set: (x: string[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v].slice(0, 10));

  async function save(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) return push("error", "Display name can't be empty.");
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: name.trim(),
          role,
          preferredLanguage: language,
          genres,
          moods,
          preferredPlatform: platform,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error?.message ?? "Could not save.");
      push("success", "Settings saved.");
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteConversations() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/chat/sessions", { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? "Could not delete.");
      setConfirmChats(false);
      push("success", "All conversations deleted.");
    } catch (e) {
      push("error", e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? "Could not delete account.");
      router.push("/");
      router.refresh();
    } catch (e) {
      push("error", e instanceof Error ? e.message : "Could not delete account.");
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-bagel text-4xl text-tx">Settings.</h1>
        <p className="text-tx2">Your account, your taste, your data. Signed in as {user.email}.</p>
      </div>

      {/* Profile + preferences */}
      <form onSubmit={save} className="grid gap-5 rounded-[32px] border-2 border-card-line bg-surf p-6 text-tx shadow-[8px_8px_0_var(--raise)] md:p-8">
        <h2 className="font-bagel text-2xl">Profile & preferences</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Display name" htmlFor="set-name">
            <Input id="set-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </Field>
          <Field label="You mostly use Muse as" htmlFor="set-role">
            <Select id="set-role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="listener">Listener</option>
              <option value="creator">Creator / artist</option>
            </Select>
          </Field>
          <Field label="Preferred language" htmlFor="set-lang">
            <Select id="set-lang" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {brand.languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Where you press play" htmlFor="set-platform">
            <Select id="set-platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {brand.platforms.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-2">
          <span className="text-sm font-semibold">Genres</span>
          <div className="flex flex-wrap gap-2">
            {brand.genres.map((g) => (
              <Chip key={g} active={genres.includes(g)} onClick={() => toggle(genres, g, setGenres)}>{g}</Chip>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <span className="text-sm font-semibold">Moods</span>
          <div className="flex flex-wrap gap-2">
            {brand.moods.map((m) => (
              <Chip key={m} active={moods.includes(m)} onClick={() => toggle(moods, m, setMoods)}>{m}</Chip>
            ))}
          </div>
        </div>
        <div>
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner label="Saving settings" /> : "Save settings"}
          </Button>
        </div>
      </form>

      {/* Appearance */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[32px] border-2 border-card-line bg-surf p-6 text-tx md:p-8" aria-label="Appearance">
        <div>
          <h2 className="font-bagel text-2xl">Appearance</h2>
          <p className="mt-1 text-sm text-muted">Dark is the Muse default; your choice is remembered on this device.</p>
        </div>
        <ThemeToggle />
      </section>

      {/* Privacy */}
      <section className="grid gap-3 rounded-[32px] border-2 border-card-line bg-deep p-6 text-tx shadow-[10px_10px_0_var(--raise)] md:p-8" aria-label="Privacy and data">
        <h2 className="flex items-center gap-2 font-bagel text-2xl">
          <ShieldCheck size={22} aria-hidden className="text-accent" /> Privacy & data
        </h2>
        <p className="text-sm leading-relaxed text-tx/85">
          Playlists are private by default; nothing is visible to anyone else unless you mark a
          playlist public. Conversations are kept only until you delete them — one by one in
          History, or all at once here. Your like / not-for-me feedback shapes recommendations and
          is removed with your account. Deleting your account removes every row you own, immediately
          and permanently.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setConfirmChats(true)}>
            <Trash2 size={16} aria-hidden /> Delete all conversations
          </Button>
        </div>
      </section>

      {/* Danger zone */}
      <section className="grid gap-3 rounded-[32px] border-2 border-dashed border-accent-2/60 p-6 md:p-8" aria-label="Danger zone">
        <h2 className="font-bagel text-2xl text-accent-2">Danger zone</h2>
        <p className="text-sm text-tx2">
          Deleting your account removes your profile, sessions, playlists, feedback and creator
          plans. It cannot be undone.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => void logout()}>
            <LogOut size={16} aria-hidden /> Log out
          </Button>
          <Button variant="danger" onClick={() => setConfirmAccount(true)}>
            <Trash2 size={16} aria-hidden /> Delete account
          </Button>
        </div>
      </section>

      <Dialog open={confirmChats} onClose={() => setConfirmChats(false)} title="Delete all conversations?">
        <div className="grid gap-4">
          <p className="text-sm text-tx/85">Every conversation in your history goes away, permanently.</p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => void deleteConversations()} disabled={busy}>
              {busy ? <Spinner label="Deleting" /> : "Delete everything"}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmChats(false)} className="text-tx/70">Keep them</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={confirmAccount} onClose={() => { setConfirmAccount(false); setPassword(""); }} title="Delete your account?">
        <div className="grid gap-4">
          <p className="text-sm text-tx/85">
            This is permanent. Enter your password to confirm.
          </p>
          <Field label="Password" htmlFor="confirm-delete-pw">
            <Input
              id="confirm-delete-pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => void deleteAccount()} disabled={busy || password.length === 0}>
              {busy ? <Spinner label="Deleting account" /> : "Delete my account"}
            </Button>
            <Button variant="ghost" onClick={() => { setConfirmAccount(false); setPassword(""); }} className="text-tx/70">
              Keep my account
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
