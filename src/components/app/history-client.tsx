"use client";

import { useState } from "react";
import Link from "next/link";
import { Headphones, History, Mic, Trash2 } from "lucide-react";
import { Button, Spinner } from "@/components/primitives";
import { Dialog } from "@/components/dialog";
import { useToast } from "@/components/toast";

type SessionRow = {
  id: string;
  title: string;
  mode: string;
  messageCount: number;
  updatedAt: string;
};

export function HistoryClient({ initial }: { initial: SessionRow[] }) {
  const { push } = useToast();
  const [sessions, setSessions] = useState(initial);
  const [deleting, setDeleting] = useState<SessionRow | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [busy, setBusy] = useState(false);

  async function deleteOne() {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/chat/sessions/${deleting.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? "Could not delete.");
      setSessions((s) => s.filter((x) => x.id !== deleting.id));
      setDeleting(null);
      push("success", "Conversation deleted.");
    } catch (e) {
      push("error", e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAll() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/chat/sessions", { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? "Could not delete.");
      setSessions([]);
      setConfirmAll(false);
      push("success", "All conversations deleted.");
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
          <h1 className="font-bagel text-4xl text-tx">History.</h1>
          <p className="text-tx2">Every conversation, saved until you say otherwise.</p>
        </div>
        {sessions.length > 0 && (
          <Button variant="danger" onClick={() => setConfirmAll(true)}>
            <Trash2 size={16} aria-hidden /> Delete all
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-[28px] border-2 border-dashed border-fieldline px-6 py-16 text-center">
          <History size={36} aria-hidden className="text-accent" />
          <p className="font-bagel text-2xl text-tx">No conversations yet</p>
          <p className="max-w-md text-sm text-tx2">Ask Muse for a song and the chat will live here.</p>
          <Link href="/listen"><Button>Start listening</Button></Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-4 rounded-3xl border-2 border-card-line bg-surf p-4 text-tx transition-colors hover:border-accent/50"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-raise text-accent">
                {s.mode === "create" ? <Mic size={18} aria-hidden /> : <Headphones size={18} aria-hidden />}
              </span>
              <Link href={s.mode === "create" ? "/create" : `/listen?session=${s.id}`} className="min-w-0 flex-1 rounded">
                <p className="truncate font-semibold hover:text-accent">{s.title}</p>
                <p className="text-xs text-dim">
                  {s.messageCount} messages · {new Date(s.updatedAt).toLocaleString()}
                </p>
              </Link>
              <button
                type="button"
                aria-label={`Delete conversation ${s.title}`}
                onClick={() => setDeleting(s)}
                className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-raise hover:text-accent-2"
              >
                <Trash2 size={17} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete conversation?">
        <div className="grid gap-4">
          <p className="text-sm text-tx/85">“{deleting?.title}” will be permanently deleted.</p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => void deleteOne()} disabled={busy}>
              {busy ? <Spinner label="Deleting" /> : "Delete"}
            </Button>
            <Button variant="ghost" onClick={() => setDeleting(null)} className="text-tx/70">Keep it</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={confirmAll} onClose={() => setConfirmAll(false)} title="Delete all conversations?">
        <div className="grid gap-4">
          <p className="text-sm text-tx/85">
            Every conversation in your history will be permanently deleted. No undo.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => void deleteAll()} disabled={busy}>
              {busy ? <Spinner label="Deleting" /> : "Delete everything"}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmAll(false)} className="text-tx/70">Keep them</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
