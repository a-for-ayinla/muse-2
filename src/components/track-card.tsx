"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Heart, ListPlus, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { isSafeExternalUrl } from "@/lib/api";

export type CardTrack = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genres: string[];
  moods?: string[];
  provider?: string;
  externalUrl?: string | null;
};

const GRADIENTS = [
  ["#C8FF2E", "#16180F"],
  ["#FF6B9A", "#23261F"],
  ["#F4EFE4", "#1A1C17"],
  ["#8E9081", "#16180F"],
  ["#C8FF2E", "#23261F"],
  ["#FF6B9A", "#16180F"],
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function ArtTile({ title, size = 64 }: { title: string; size?: number }) {
  const [a, b] = GRADIENTS[hashStr(title) % GRADIENTS.length];
  const initial = title.trim().slice(0, 1).toUpperCase() || "M";
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-2xl border-2 border-ink/60"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${a} 0%, ${b} 78%)`,
      }}
    >
      <span
        className="font-bagel"
        style={{
          fontSize: size * 0.42,
          color: hashStr(title) % 2 === 0 ? "#0E0F0C" : "#F4EFE4",
        }}
      >
        {initial}
      </span>
    </span>
  );
}

/**
 * A real URL built from a platform *search page* (never a fabricated track
 * page). Used only for demo tracks whose listening links don't exist.
 */
export function platformSearchUrl(platform: string, title: string, artist: string): string {
  const q = encodeURIComponent(`${title} ${artist}`);
  switch (platform) {
    case "spotify":
      return `https://open.spotify.com/search/${q}`;
    case "apple":
      return `https://music.apple.com/us/search?term=${q}`;
    case "youtube":
      return `https://music.youtube.com/search?q=${q}`;
    case "audiomack":
      return `https://audiomack.com/search?q=${q}`;
    case "boomplay":
      return `https://www.boomplay.com/search/default?q=${q}`;
    default:
      return `https://music.youtube.com/search?q=${q}`;
  }
}

export function TrackCard({
  track,
  isDemo = false,
  platform = "any",
  initialFeedback = null,
  onFeedback,
  onSave,
  onRemove,
  reorderControls,
  compact = false,
}: {
  track: CardTrack;
  isDemo?: boolean;
  platform?: string;
  initialFeedback?: "like" | "not_for_me" | null;
  onFeedback?: (kind: "like" | "not_for_me") => Promise<void> | void;
  onSave?: () => void;
  onRemove?: () => void;
  reorderControls?: React.ReactNode;
  compact?: boolean;
}) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [popping, setPopping] = useState(false);
  const [busy, setBusy] = useState(false);
  const reason = useMemo(() => track.genres.slice(0, 2).join(" · "), [track.genres]);

  async function give(kind: "like" | "not_for_me") {
    if (!onFeedback || busy) return;
    setBusy(true);
    const next = feedback === kind ? null : kind;
    try {
      await onFeedback(kind);
      setFeedback(next);
      if (kind === "like") {
        setPopping(true);
        setTimeout(() => setPopping(false), 400);
      }
    } finally {
      setBusy(false);
    }
  }

  const verified = isSafeExternalUrl(track.externalUrl ?? null);
  const href = verified
    ? track.externalUrl!
    : isDemo
      ? platformSearchUrl(platform, track.title, track.artist)
      : null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-3xl border-2 border-[#2A2D23] bg-surf p-3 text-cream transition-colors hover:border-lime/60",
        compact && "p-2.5",
      )}
    >
      {reorderControls}
      <ArtTile title={track.title} size={compact ? 48 : 64} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{track.title}</p>
        <p className="truncate text-sm text-muted">{track.artist}</p>
        {reason && <p className="mt-0.5 truncate text-xs text-dim">{reason}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {onFeedback && (
          <>
            <button
              type="button"
              aria-label={`Like “${track.title}”`}
              aria-pressed={feedback === "like"}
              onClick={() => give("like")}
              className={cn(
                "grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-raise",
                feedback === "like" ? "text-pink" : "text-muted hover:text-pink",
              )}
            >
              <Heart
                size={20}
                aria-hidden
                className={cn(feedback === "like" && "fill-pink", popping && "anim-pop")}
              />
            </button>
            <button
              type="button"
              aria-label={`“${track.title}” is not for me`}
              aria-pressed={feedback === "not_for_me"}
              onClick={() => give("not_for_me")}
              className={cn(
                "grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-raise",
                feedback === "not_for_me" ? "text-lime" : "text-muted hover:text-lime",
              )}
            >
              <ThumbsDown size={19} aria-hidden />
            </button>
          </>
        )}
        {onSave && (
          <button
            type="button"
            aria-label={`Save “${track.title}” to a playlist`}
            onClick={onSave}
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-raise hover:text-lime"
          >
            <ListPlus size={20} aria-hidden />
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            aria-label={`Remove “${track.title}” from this playlist`}
            onClick={onRemove}
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-raise hover:text-pink"
          >
            <ThumbsDown size={19} aria-hidden className="rotate-180" />
          </button>
        )}
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              verified
                ? `Open “${track.title}” on its music platform`
                : `Search for “${track.title}” on a music platform (demo track)`
            }
            className="grid h-11 w-11 place-items-center rounded-full text-muted transition-colors hover:bg-raise hover:text-cream"
          >
            <ExternalLink size={19} aria-hidden />
          </a>
        ) : (
          <span
            title="Listening link unavailable"
            aria-label="Listening link unavailable for this track"
            className="grid h-11 w-11 place-items-center rounded-full text-dim"
          >
            <ExternalLink size={19} aria-hidden />
          </span>
        )}
      </div>
    </div>
  );
}
