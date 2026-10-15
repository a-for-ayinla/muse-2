"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Globe2, GripVertical, Lock, Music2, Pencil } from "lucide-react";
import { Button, Field, Input, Spinner } from "@/components/primitives";
import { Dialog } from "@/components/dialog";
import { TrackCard, type CardTrack } from "@/components/track-card";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";

export function PlaylistDetailClient({
  playlist,
  tracks: initialTracks,
  feedback: initialFeedback,
  isOwner,
  isDemo,
  platform,
}: {
  playlist: { id: string; title: string; description: string; visibility: string };
  tracks: CardTrack[];
  feedback: Record<string, string>;
  isOwner: boolean;
  isDemo: boolean;
  platform: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [meta, setMeta] = useState(playlist);
  const [tracks, setTracks] = useState(initialTracks);
  const [fbMap, setFbMap] = useState<Record<string, string>>(initialFeedback);
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(playlist.title);
  const [dragId, setDragId] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>, revert?: () => void) {
    setBusy(true);
    try {
      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error?.message ?? "Update failed.");
      return data.data.playlist;
    } catch (e) {
      revert?.();
      push("error", e instanceof Error ? e.message : "Update failed.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function saveMeta(visibility?: string) {
    const body: Record<string, unknown> = {};
    if (title.trim() && title.trim() !== meta.title) body.title = title.trim();
    if (visibility && visibility !== meta.visibility) body.visibility = visibility;
    if (Object.keys(body).length === 0) {
      setEditOpen(false);
      return;
    }
    const updated = await patch(body);
    if (updated) {
      setMeta((m) => ({ ...m, title: updated.title, visibility: updated.visibility }));
      push("success", "Playlist updated.");
      setEditOpen(false);
      router.refresh();
    }
  }

  async function removeTrack(id: string) {
    const before = tracks;
    setTracks((ts) => ts.filter((t) => t.id !== id));
    const updated = await patch({ removeTrackIds: [id] }, () => setTracks(before));
    if (updated) push("success", "Track removed.");
  }

  async function applyOrder(next: CardTrack[]) {
    const before = tracks;
    setTracks(next);
    await patch({ order: next.map((t) => t.id) }, () => setTracks(before));
  }

  function move(id: string, dir: -1 | 1) {
    const i = tracks.findIndex((t) => t.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= tracks.length) return;
    const next = [...tracks];
    [next[i], next[j]] = [next[j], next[i]];
    void applyOrder(next);
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = tracks.findIndex((t) => t.id === dragId);
    const to = tracks.findIndex((t) => t.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...tracks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragId(null);
    void applyOrder(next);
  }

  async function giveFeedback(track: CardTrack, kind: "like" | "not_for_me") {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trackId: track.id, kind }),
    });
    if (!res.ok) return push("error", "Could not save feedback.");
    setFbMap((m) => ({ ...m, [track.id]: kind }));
  }

  return (
    <div className="grid gap-6">
      <Link href="/playlists" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-tx2 hover:text-lime">
        <ArrowLeft size={16} aria-hidden /> All playlists
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-bagel text-4xl text-tx">{meta.title}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-tx2">
            {tracks.length} {tracks.length === 1 ? "track" : "tracks"} ·{" "}
            {meta.visibility === "public" ? (
              <span className="inline-flex items-center gap-1 text-lime"><Globe2 size={13} aria-hidden /> public</span>
            ) : (
              <span className="inline-flex items-center gap-1"><Lock size={13} aria-hidden /> private</span>
            )}
          </p>
          {meta.description && <p className="mt-2 max-w-lg text-sm text-tx2">{meta.description}</p>}
        </div>
        {isOwner && (
          <Button variant="outline" onClick={() => { setTitle(meta.title); setEditOpen(true); }}>
            <Pencil size={16} aria-hidden /> Edit details
          </Button>
        )}
      </div>

      {isDemo && (
        <p role="note" className="rounded-2xl border-2 border-dashed border-lime/70 bg-surf px-4 py-3 text-sm text-cream/85">
          Demo data is on — these tracks are fictional. The open button searches your platform for the (invented) title.
        </p>
      )}

      {tracks.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-[28px] border-2 border-dashed border-fieldline px-6 py-16 text-center">
          <Music2 size={36} aria-hidden className="text-lime" />
          <p className="font-bagel text-2xl text-tx">Empty playlist</p>
          <p className="max-w-md text-sm text-tx2">
            Head to Listen, ask for a vibe, and save tracks here with the plus button.
          </p>
          <Link href="/listen">
            <Button>Ask Muse for music</Button>
          </Link>
        </div>
      ) : (
        <ul className="grid gap-2.5" aria-label={`Tracks in ${meta.title}`}>
          {tracks.map((t, i) => (
            <li
              key={t.id}
              draggable={isOwner}
              onDragStart={() => setDragId(t.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(t.id)}
              className={cn(dragId === t.id && "opacity-40")}
            >
              <TrackCard
                track={t}
                isDemo={isDemo}
                platform={platform}
                initialFeedback={(fbMap[t.id] as "like" | "not_for_me") ?? null}
                onFeedback={(kind) => giveFeedback(t, kind)}
                onRemove={isOwner ? () => void removeTrack(t.id) : undefined}
                reorderControls={
                  isOwner ? (
                    <span className="flex shrink-0 flex-col items-center gap-0.5 pl-1">
                      <span className="flex items-center text-dim">
                        <GripVertical size={15} aria-hidden />
                      </span>
                      <button
                        type="button"
                        aria-label={`Move “${t.title}” up`}
                        disabled={busy || i === 0}
                        onClick={() => move(t.id, -1)}
                        className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-raise hover:text-lime disabled:opacity-30"
                      >
                        <ChevronUp size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move “${t.title}” down`}
                        disabled={busy || i === tracks.length - 1}
                        onClick={() => move(t.id, 1)}
                        className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-raise hover:text-lime disabled:opacity-30"
                      >
                        <ChevronDown size={16} aria-hidden />
                      </button>
                    </span>
                  ) : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit playlist">
        <div className="grid gap-5">
          <Field label="Name" htmlFor="edit-pl-title">
            <Input id="edit-pl-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className="bg-raise text-cream" />
          </Field>
          <div className="grid gap-1.5">
            <span className="text-sm font-semibold text-cream">Visibility</span>
            <div className="flex gap-2">
              <button
                type="button"
                aria-pressed={meta.visibility !== "public"}
                onClick={() => void saveMeta("private")}
                className={cn(
                  "min-h-11 cursor-pointer rounded-full border-2 px-4 text-sm font-semibold",
                  meta.visibility !== "public" ? "border-ink bg-lime text-ink" : "border-[#4A4D40] text-cream/80",
                )}
              >
                <Lock size={14} aria-hidden className="mr-1 inline" /> Private
              </button>
              <button
                type="button"
                aria-pressed={meta.visibility === "public"}
                onClick={() => void saveMeta("public")}
                className={cn(
                  "min-h-11 cursor-pointer rounded-full border-2 px-4 text-sm font-semibold",
                  meta.visibility === "public" ? "border-ink bg-lime text-ink" : "border-[#4A4D40] text-cream/80",
                )}
              >
                <Globe2 size={14} aria-hidden className="mr-1 inline" /> Public
              </button>
            </div>
            <p className="text-xs text-dim">Public playlists can be viewed by anyone signed in with the link.</p>
          </div>
          <Button onClick={() => void saveMeta()} disabled={busy || !title.trim()}>
            {busy ? <Spinner label="Saving" /> : "Save changes"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
