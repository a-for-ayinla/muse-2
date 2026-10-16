"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { History, ListMusic, SendHorizonal, TriangleAlert, X } from "lucide-react";
import { Button, Equalizer, ModeToggle, Spinner, Sticker } from "@/components/primitives";
import { Dialog } from "@/components/dialog";
import { TrackCard, type CardTrack } from "@/components/track-card";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";

type ProviderInfo = { name: string; isDemo: boolean; attribution: string; configured: boolean };
type Msg = {
  key: string;
  role: "user" | "assistant";
  content: string;
  tracks?: CardTrack[];
  followUps?: string[];
  unavailable?: boolean;
};

const uid = () => Math.random().toString(36).slice(2);

export function ListenClient({
  provider,
  userName,
  platform,
  recentSessions,
  openSessionId,
  playlists,
  feedback: initialFeedback,
  suggested,
}: {
  provider: ProviderInfo;
  userName: string;
  platform: string;
  recentSessions: { id: string; title: string; mode: string; updatedAt: string }[];
  openSessionId: string | null;
  playlists: { id: string; title: string }[];
  feedback: Record<string, string>;
  suggested: string[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [fbMap, setFbMap] = useState<Record<string, string>>(initialFeedback);
  const [saveTrack, setSaveTrack] = useState<CardTrack | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingSession, setLoadingSession] = useState(!!openSessionId);
  const scroller = useRef<HTMLDivElement>(null);

  const scrollDown = () =>
    requestAnimationFrame(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }));

  /* Load an existing conversation (from History or recent list) */
  useEffect(() => {
    if (!openSessionId) return;
    (async () => {
      try {
        const res = await fetch(`/api/chat?sessionId=${openSessionId}`);
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data?.error?.message ?? "Could not open that conversation.");
        setSessionId(openSessionId);
        setMessages(
          data.data.messages.map((m: { id: string; role: string; content: string; tracks?: CardTrack[] }) => ({
            key: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            tracks: m.tracks ?? [],
          })),
        );
      } catch (e) {
        push("error", e instanceof Error ? e.message : "Could not open that conversation.");
      } finally {
        setLoadingSession(false);
        scrollDown();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSessionId]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || thinking) return;
    setLastPrompt(message);
    setErrorMsg(null);
    setInput("");
    setMessages((m) => [...m, { key: uid(), role: "user", content: message }]);
    setThinking(true);
    scrollDown();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "listen", message, sessionId: sessionId ?? undefined }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push("/login?next=/listen");
        return;
      }
      const unavailable = data?.error?.code === "CATALOG_UNAVAILABLE";
      if (!res.ok && !unavailable) throw new Error(data?.error?.message ?? "Muse stumbled. Try again.");
      const payload = unavailable ? { reply: data.error.message } : data.data;
      setSessionId(data.data?.sessionId ?? sessionId);
      setMessages((m) => [
        ...m,
        {
          key: uid(),
          role: "assistant",
          content: payload.reply,
          tracks: payload.tracks ?? [],
          followUps: payload.followUps ?? [],
          unavailable,
        },
      ]);
      if (data.data?.sessionId && !sessionId) router.refresh();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Muse stumbled. Try again.");
    } finally {
      setThinking(false);
      scrollDown();
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  async function giveFeedback(track: CardTrack, kind: "like" | "not_for_me") {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trackId: track.id, kind, sessionId: sessionId ?? undefined }),
    });
    if (!res.ok) {
      push("error", "Could not save that feedback.");
      return;
    }
    setFbMap((m) => ({ ...m, [track.id]: kind }));
    if (kind === "like") push("success", `Noted — more like “${track.title}”.`);
    if (kind === "not_for_me") push("success", "Got it — fewer of those.");
  }

  async function saveToPlaylist(playlistId: string | null) {
    if (!saveTrack || saving) return;
    setSaving(true);
    try {
      const res = playlistId
        ? await fetch(`/api/playlists/${playlistId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ addTrackIds: [saveTrack.id] }),
          })
        : await fetch("/api/playlists", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title: newPlaylistName.trim() || "New playlist", trackIds: [saveTrack.id] }),
          });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error?.message ?? "Could not save.");
      push("success", `“${saveTrack.title}” saved to a playlist.`);
      setSaveTrack(null);
      setNewPlaylistName("");
      router.refresh();
    } catch (e) {
      push("error", e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      {/* Header + mode switch */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-bagel text-4xl text-tx">
            Listen, <span className="text-accent">{userName || "friend"}</span>.
          </h1>
          <p className="text-tx2">Ask in English or Pidgin. Every song comes from the catalog.</p>
        </div>
        <ModeToggle
          value="listen"
          onChange={(v) => v === "create" && router.push("/create")}
          label="Switch between Listen and Create modes"
        />
      </div>

      {/* Demo / catalog banners */}
      {provider.isDemo && (
        <div
          role="note"
          className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-accent/70 bg-surf px-4 py-3 text-sm text-tx"
        >
          <Sticker color="lime" rotate={-2} className="shrink-0 text-xs">Demo data</Sticker>
          <span className="text-tx/85">
            You are hearing from a fictional sample catalog (MUSIC_PROVIDERS=demo). Track names
            are invented — nothing here is a real release.
          </span>
        </div>
      )}
      {!provider.configured && (
        <div
          role="note"
          className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-accent-2/70 bg-surf px-4 py-3 text-sm text-tx"
        >
          <TriangleAlert size={20} aria-hidden className="shrink-0 text-accent-2" />
          <span className="text-tx/85">
            Catalog unavailable (MUSIC_PROVIDERS=none). Muse will answer honestly instead of
            inventing songs.
          </span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_290px]">
        {/* Chat surface */}
        <section
          aria-label="Conversation with Muse"
          className="flex min-h-[62vh] flex-col rounded-[32px] border-2 border-card-line bg-deep text-tx shadow-[10px_10px_0_var(--raise)]"
        >
          <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto p-5 md:p-7" aria-live="polite">
            {loadingSession && (
              <div className="grid place-items-center gap-3 py-16 text-muted">
                <Spinner label="Loading conversation" /> Loading your conversation…
              </div>
            )}
            {!loadingSession && messages.length === 0 && !thinking && (
              <div className="grid gap-5 py-4">
                <p className="max-w-md font-bagel text-2xl leading-snug text-tx">
                  Tell me the mood, the moment or the madness.
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggested.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="min-h-11 cursor-pointer rounded-full border-2 border-line px-4 py-2 text-left text-sm text-tx/85 transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.key} className={cn("grid gap-2.5", m.role === "user" && "justify-items-end")}>
                <div
                  className={cn(
                    "max-w-[90%] rounded-3xl border-2 px-4 py-3 text-[15px] leading-relaxed",
                    m.role === "user"
                      ? "rounded-br-lg border-ink bg-lime text-ink shadow-[3px_3px_0_var(--shadow)]"
                      : "rounded-bl-lg border-line bg-raise text-tx",
                  )}
                >
                  {m.content}
                  {m.unavailable && (
                    <span className="mt-2 block">
                      <Sticker color="pink" rotate={-2} className="text-xs">Catalog unavailable</Sticker>
                    </span>
                  )}
                </div>
                {m.tracks && m.tracks.length > 0 && (
                  <div className="grid w-full gap-2">
                    {m.tracks.map((t) => (
                      <TrackCard
                        key={t.id}
                        track={t}
                        isDemo={provider.isDemo}
                        platform={platform}
                        initialFeedback={(fbMap[t.id] as "like" | "not_for_me") ?? null}
                        onFeedback={(kind) => giveFeedback(t, kind)}
                        onSave={() => setSaveTrack(t)}
                      />
                    ))}
                  </div>
                )}
                {m.followUps && m.followUps.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {m.followUps.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => void send(f)}
                        className="min-h-11 cursor-pointer rounded-full border-2 border-dashed border-fieldline px-4 py-1.5 text-xs font-semibold text-tx/75 transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {thinking && (
              <div className="flex items-center gap-3 rounded-3xl rounded-bl-lg border-2 border-line bg-raise px-4 py-3 text-tx/85 w-fit">
                <Equalizer bars={5} className="h-5" label="Muse is thinking" />
                <span className="text-sm">Checking the catalog…</span>
              </div>
            )}

            {errorMsg && (
              <div role="alert" className="grid gap-3 rounded-3xl border-2 border-dashed border-accent-2/70 bg-surf p-4">
                <p className="text-sm font-semibold text-err">{errorMsg}</p>
                <Button variant="outline" className="w-fit text-tx" onClick={() => lastPrompt && void send(lastPrompt)}>
                  Retry
                </Button>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={submit} className="border-t-2 border-card-line p-4">
            <div className="flex items-center gap-2 rounded-full border-2 border-fieldline bg-raise p-1.5 pl-5 focus-within:border-accent">
              <label htmlFor="listen-input" className="sr-only">
                Ask Muse for music
              </label>
              <input
                id="listen-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Try: Wetin dey sweet for night?"
                maxLength={500}
                className="min-h-11 min-w-0 flex-1 bg-transparent text-tx placeholder:text-dim focus:outline-none"
              />
              <button
                type="submit"
                disabled={thinking || input.trim().length === 0}
                aria-label="Send message"
                className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-ink bg-lime text-ink shadow-[3px_3px_0_var(--shadow)] transition-all hover:-translate-y-0.5 disabled:opacity-50"
              >
                {thinking ? <Spinner label="Sending" /> : <SendHorizonal size={19} aria-hidden />}
              </button>
            </div>
          </form>
        </section>

        {/* Side rail */}
        <aside className="grid content-start gap-5">
          <section className="rounded-[28px] border-2 border-card-line bg-surf p-5 text-tx" aria-label="Recent conversations">
            <h2 className="flex items-center gap-2 font-bagel text-lg">
              <History size={18} aria-hidden className="text-accent" /> Recent sessions
            </h2>
            {recentSessions.length === 0 ? (
              <p className="mt-3 text-sm text-dim">Nothing yet — your chats will land here.</p>
            ) : (
              <ul className="mt-3 grid gap-1.5">
                {recentSessions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/listen?session=${s.id}`}
                      className="block truncate rounded-xl px-2 py-2 text-sm text-tx/80 transition-colors hover:bg-raise hover:text-accent"
                    >
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[28px] border-2 border-card-line bg-surf p-5 text-tx" aria-label="Your playlists">
            <h2 className="flex items-center gap-2 font-bagel text-lg">
              <ListMusic size={18} aria-hidden className="text-accent" /> Playlists
            </h2>
            {playlists.length === 0 ? (
              <p className="mt-3 text-sm text-dim">
                No playlists yet — tap the <span aria-hidden>＋</span> on any track.
              </p>
            ) : (
              <ul className="mt-3 grid gap-1.5">
                {playlists.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/playlists/${p.id}`}
                      className="block truncate rounded-xl px-2 py-2 text-sm text-tx/80 transition-colors hover:bg-raise hover:text-accent"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/playlists" className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
              Open Playlists →
            </Link>
          </section>
        </aside>
      </div>

      {/* Save-to-playlist dialog */}
      <Dialog open={!!saveTrack} onClose={() => setSaveTrack(null)} title="Save to playlist">
        {saveTrack && (
          <div className="grid gap-4">
            <p className="text-sm text-tx/80">
              “<span className="font-semibold text-tx">{saveTrack.title}</span>” — {saveTrack.artist}
            </p>
            {playlists.length > 0 && (
              <div className="grid max-h-56 gap-1.5 overflow-y-auto">
                {playlists.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={saving}
                    onClick={() => void saveToPlaylist(p.id)}
                    className="flex min-h-11 cursor-pointer items-center justify-between rounded-2xl border-2 border-line px-4 text-left text-sm font-semibold text-tx transition-colors hover:border-accent"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            )}
            <div className="border-t-2 border-card-line pt-4">
              <label htmlFor="new-pl" className="text-sm font-semibold text-tx">
                Or start a new playlist
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="new-pl"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="e.g. Night drive fuel"
                  className="min-h-11 min-w-0 flex-1 rounded-2xl border-2 border-fieldline bg-raise px-4 text-tx placeholder:text-dim"
                />
                <Button disabled={saving || newPlaylistName.trim().length === 0} onClick={() => void saveToPlaylist(null)}>
                  {saving ? <Spinner label="Saving" /> : "Create"}
                </Button>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setSaveTrack(null)} className="text-tx/70">
              <X size={16} aria-hidden /> Cancel
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
