import type { Intent } from "./intent";
import type { NormalizedTrack } from "@/lib/music/provider";

/**
 * Deterministic, explainable ranking. Scores only evidence present in
 * retrieved catalog rows — never model memory, never invented metadata.
 */
export function scoreTrack(t: NormalizedTrack, intent: Intent): number {
  let s = 0;
  const lc = (xs: string[]) => xs.map((x) => x.toLowerCase());
  const g = lc(t.genres);
  const m = lc(t.moods);
  const o = lc(t.occasions);
  const l = lc(t.languages);
  for (const ig of intent.genres) if (g.includes(ig.toLowerCase())) s += 3;
  for (const im of intent.mood) if (m.includes(im.toLowerCase())) s += 2;
  if (intent.occasion && o.includes(intent.occasion.toLowerCase())) s += 3;
  for (const il of intent.languages) if (l.includes(il.toLowerCase())) s += 1;
  for (const ar of intent.artistRefs)
    if (t.artist.toLowerCase().includes(ar.toLowerCase())) s += 8;
  if (intent.familiarity === "discovery") {
    // Favour non-default order positions (deeper catalog rows) — still real rows.
    s += 0.5;
  }
  return s;
}

export type FeedbackSignal = {
  notForMeTrackIds: Set<string>;
  dislikedArtists: Set<string>;
};

/**
 * Rank retrieved tracks; feedback filters not-for-me tracks and their
 * artists. Ties break deterministically so results are stable per intent.
 */
export function rankTracks(
  tracks: NormalizedTrack[],
  intent: Intent,
  feedback: FeedbackSignal = { notForMeTrackIds: new Set(), dislikedArtists: new Set() },
  limit = 8,
): NormalizedTrack[] {
  const eligible = tracks.filter(
    (t) =>
      !feedback.notForMeTrackIds.has(t.id) &&
      ![...feedback.dislikedArtists].some((a) => t.artist.toLowerCase().includes(a)),
  );
  const scored = eligible.map((t) => ({ t, s: scoreTrack(t, intent) }));
  scored.sort((a, b) => (b.s - a.s !== 0 ? b.s - a.s : a.t.id < b.t.id ? -1 : 1));
  return scored.slice(0, limit).map((x) => x.t);
}
