"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe2, ListMusic, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, Field, Input, Spinner, Textarea } from "@/components/primitives";
import { Dialog } from "@/components/dialog";
import { ArtTile } from "@/components/track-card";
import { useToast } from "@/components/toast";

type PlaylistRow = {
  id: string;
  title: string;
  description: string;
  visibility: string;
  trackCount: number;
  updatedAt: string;
};

export function PlaylistsClient({ initial, isDemo }: { initial: PlaylistRow[]; isDemo: boolean }) {
  const router = useRouter();
  const { push } = useToast();
  const [playlists, setPlaylists] = useState(initial);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState<PlaylistRow | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<PlaylistRow | null>(null);

  async function create() {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: t, description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error?.message ?? "Could not create playlist.");
      setPlaylists((ps) => [
        { ...data.data.playlist, trackCount: 0, updatedAt: data.data.playlist.updatedAt },
        ...ps,
      ]);
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      push("success", `Playlist “${t}” created.`);
      router.push(`/playlists/${data.data.playlist.id}`);
    } catch (e) {
      push("error", e instanceof Error ? e.message : "Could not create playlist.");
    } finally {
      setBusy(false);
    }
  }

  async function rename() {
    if (!renaming || !renameValue.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/playlists/${renaming.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: renameValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error?.message ?? "Could not rename.");
      setPlaylists((ps) => ps.map((p) => (p.id === renaming.id ? { ...p, title: renameValue.trim() } : p)));
      setRenaming(null);
      push("success", "Renamed.");
    } catch (e) {
      push("error", e instanceof Error ? e.message : "Could not rename.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/playlists/${deleting.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? "Could not delete.");
      setPlaylists((ps) => ps.filter((p) => p.id !== deleting.id));
      setDeleting(null);
      push("success", "Playlist deleted.");
    } catch (e) {
      push("error", e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-bagel text-4xl text-tx">Playlists.</h1>
          <p className="text-tx2">Saved picks, private by default. Play them wherever you pay.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={18} aria-hidden /> New playlist
        </Button>
      </div>

      {isDemo && (
        <p role="note" className="rounded-2xl border-2 border-dashed border-accent/70 bg-surf px-4 py-3 text-sm text-tx/85">
          Demo data is on — tracks you save come from the fictional sample catalog.
        </p>
      )}

      {playlists.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-[28px] border-2 border-dashed border-fieldline px-6 py-16 text-center">
          <ListMusic size={36} aria-hidden className="text-accent" />
          <p className="font-bagel text-2xl text-tx">No playlists yet</p>
          <p className="max-w-md text-sm text-tx2">
            Ask Muse for something smooth in Listen, then save the winners. Or start an empty one now.
          </p>
          <Button onClick={() => setCreateOpen(true)}>Create your first playlist</Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {playlists.map((p) => (
            <li
              key={p.id}
              className="group flex items-center gap-4 rounded-[28px] border-2 border-card-line bg-surf p-4 text-tx transition-all hover:-translate-y-1 hover:border-accent/60 hover:shadow-[6px_6px_0_var(--raise)]"
            >
              <ArtTile title={p.title} size={72} />
              <div className="min-w-0 flex-1">
                <Link href={`/playlists/${p.id}`} className="block truncate rounded font-bagel text-xl hover:text-accent">
                  {p.title}
                </Link>
                <p className="text-sm text-dim">
                  {p.trackCount} {p.trackCount === 1 ? "track" : "tracks"} ·{" "}
                  {p.visibility === "public" ? (
                    <span className="inline-flex items-center gap-1"><Globe2 size={12} aria-hidden /> public</span>
                  ) : (
                    <span className="inline-flex items-center gap-1"><Lock size={12} aria-hidden /> private</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Rename ${p.title}`}
                  onClick={() => { setRenaming(p); setRenameValue(p.title); }}
                  className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-raise hover:text-accent"
                >
                  <Pencil size={17} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${p.title}`}
                  onClick={() => setDeleting(p)}
                  className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-raise hover:text-accent-2"
                >
                  <Trash2 size={17} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="New playlist">
        <div className="grid gap-4">
          <Field label="Name" htmlFor="pl-name">
            <Input id="pl-name" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Owambe starters" />
          </Field>
          <Field label="Description (optional)" htmlFor="pl-desc">
            <Textarea id="pl-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} className="min-h-20" />
          </Field>
          <Button onClick={() => void create()} disabled={busy || !title.trim()}>
            {busy ? <Spinner label="Creating" /> : "Create playlist"}
          </Button>
        </div>
      </Dialog>

      <Dialog open={!!renaming} onClose={() => setRenaming(null)} title="Rename playlist">
        <div className="grid gap-4">
          <Field label="Name" htmlFor="pl-rename">
            <Input id="pl-rename" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} maxLength={80} />
          </Field>
          <Button onClick={() => void rename()} disabled={busy || !renameValue.trim()}>
            {busy ? <Spinner label="Saving" /> : "Save name"}
          </Button>
        </div>
      </Dialog>

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete playlist?">
        <div className="grid gap-4">
          <p className="text-sm text-tx/85">
            “{deleting?.title}” and its track list will be permanently deleted.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => void remove()} disabled={busy}>
              {busy ? <Spinner label="Deleting" /> : "Delete it"}
            </Button>
            <Button variant="ghost" onClick={() => setDeleting(null)} className="text-tx/70">Keep it</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
