import { z } from "zod";

/**
 * Intent schema — structured understanding of a listener request.
 * Validated with Zod whether produced by the deterministic extractor or
 * (when configured) an LLM with structured output.
 */
export const intentSchema = z.object({
  mood: z.array(z.string()).max(5).default([]),
  genres: z.array(z.string()).max(6).default([]),
  languages: z.array(z.string()).max(4).default([]),
  occasion: z.string().max(40).nullable().default(null),
  artistRefs: z.array(z.string()).max(5).default([]),
  excludedArtists: z.array(z.string()).max(5).default([]),
  familiarity: z.enum(["familiar", "discovery"]).nullable().default(null),
  query: z.string().max(120).nullable().default(null),
  summary: z.string().max(280).default(""),
});
export type Intent = z.infer<typeof intentSchema>;

const GENRE_ALIASES: Record<string, string> = {
  afrobeats: "Afrobeats",
  afrobeat: "Afrobeats",
  "afro beats": "Afrobeats",
  alte: "Alté",
  "alté": "Alté",
  highlife: "Highlife",
  fuji: "Fuji",
  juju: "Juju",
  "jùjú": "Juju",
  apala: "Apala",
  "àpàlà": "Apala",
  amapiano: "Amapiano",
  piano: "Amapiano",
  "afro-fusion": "Afro-fusion",
  "afro fusion": "Afro-fusion",
  fusion: "Afro-fusion",
  "afro-soul": "Afro-soul",
  "afro soul": "Afro-soul",
  soul: "Afro-soul",
  gospel: "Gospel",
  praise: "Gospel",
  "r&b": "Afro-soul",
};

const MOOD_ALIASES: Record<string, string> = {
  smooth: "Smooth",
  mellow: "Smooth",
  soft: "Smooth",
  chill: "Chill",
  relaxed: "Chill",
  "calm": "Chill",
  upbeat: "Upbeat",
  energetic: "Upbeat",
  happy: "Upbeat",
  romantic: "Romantic",
  love: "Romantic",
  reflective: "Reflective",
  thoughtful: "Reflective",
  sad: "Reflective",
  party: "Party",
  turn: "Party",
  turnt: "Party",
  worship: "Worship",
  gospel: "Worship",
  praise: "Worship",
  hype: "Hype",
  ginger: "Hype",
  pumped: "Hype",
  focused: "Focused",
  focus: "Focused",
  study: "Focused",
  sweet: "Sweet", // Pidgin: "sweet" = feel-good
  "feel-good": "Sweet",
  feelgood: "Sweet",
};

const OCCASION_ALIASES: Record<string, string> = {
  "night drive": "night-drive",
  "night-drive": "night-drive",
  "late night": "night-drive",
  midnight: "night-drive",
  driving: "night-drive",
  owambe: "owambe",
  owanbe: "owambe",
  party: "party",
  "house party": "party",
  club: "party",
  wedding: "wedding",
  "sunday": "sunday",
  "sunday afternoon": "sunday",
  "sunday morning": "sunday",
  church: "sunday",
  weekend: "sunday",
  workout: "workout",
  gym: "workout",
  exercise: "workout",
  study: "study",
  reading: "study",
  work: "study",
  focus: "study",
  street: "street",
  streets: "street",
  hustle: "street",
  date: "date",
  dinner: "date",
  chill: "chill",
  chilling: "chill",
  relax: "chill",
  praise: "praise",
  thanksgiving: "praise",
};

const PIDGIN_SIGNALS: Array<{ re: RegExp; moods: string[]; occasion?: string; genres?: string[] }> = [
  { re: /wetin dey sweet/i, moods: ["Sweet", "Upbeat"], genres: ["Afrobeats"] },
  { re: /wetin dey/i, moods: ["Upbeat"] },
  { re: /make e sweet/i, moods: ["Sweet"] },
  { re: /gbedu/i, moods: ["Party", "Hype"], genres: ["Afrobeats"] },
  { re: /owambe|owanbe/i, moods: ["Party", "Upbeat"], occasion: "owambe", genres: ["Afrobeats"] },
  { re: /chop life/i, moods: ["Sweet", "Chill"] },
  { re: /jollof/i, moods: ["Party", "Sweet"], occasion: "owambe" },
  { re: /no wahala/i, moods: ["Chill", "Smooth"] },
  { re: /cool (me )?down/i, moods: ["Chill", "Smooth"] },
  { re: /vibes?/i, moods: ["Sweet"] },
  { re: /sapa/i, moods: ["Reflective"] },
  { re: /odogwu|level don change/i, moods: ["Hype", "Upbeat"] },
  { re: /abeg/i, moods: [] },
  { re: /sunday/i, moods: ["Chill", "Sweet"], occasion: "sunday" },
];

function uniqPush(arr: string[], v: string) {
  if (!arr.includes(v)) arr.push(v);
}

/**
 * Deterministic, Pidgin-aware intent extractor.
 * Understands Nigerian English + Pidgin signals. Used when no LLM is
 * configured (honest default) and as the validator's safety net when one is.
 */
export function extractIntent(message: string): Intent {
  const text = message.slice(0, 500);
  const lower = text.toLowerCase();
  const moods: string[] = [];
  const genres: string[] = [];
  const languages: string[] = [];
  let occasion: string | null = null;
  let familiarity: Intent["familiarity"] = null;
  const artistRefs: string[] = [];
  const excludedArtists: string[] = [];

  for (const sig of PIDGIN_SIGNALS) {
    if (sig.re.test(text)) {
      sig.moods.forEach((m) => uniqPush(moods, m));
      sig.genres?.forEach((g) => uniqPush(genres, g));
      if (sig.occasion && !occasion) occasion = sig.occasion;
    }
  }
  for (const [alias, canonical] of Object.entries(GENRE_ALIASES)) {
    if (lower.includes(alias)) uniqPush(genres, canonical);
  }
  for (const [alias, canonical] of Object.entries(MOOD_ALIASES)) {
    if (new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)) {
      uniqPush(moods, canonical);
    }
  }
  for (const [alias, canonical] of Object.entries(OCCASION_ALIASES)) {
    if (lower.includes(alias)) {
      occasion = canonical;
      break;
    }
  }
  if (/\b(yoruba|igbo|hausa|pidgin|english)\b/i.test(lower)) {
    const m = lower.match(/\b(yoruba|igbo|hausa|pidgin|english)\b/gi) ?? [];
    m.forEach((l) => uniqPush(languages, l[0].toUpperCase() + l.slice(1).toLowerCase()));
  }
  if (/smaller artists|underrated|underground|upcoming|emerging|less[- ]known|new artists|discovery|discover/i.test(lower)) {
    familiarity = "discovery";
  }
  if (/popular|big artists|famous|mainstream/i.test(lower)) {
    familiarity = "familiar";
  }
  const excl = text.match(/(?:no|not|without|except|don'?t want)\s+([A-Za-z][\w '&.-]{1,30})/gi) ?? [];
  for (const e of excl) {
    const name = e.replace(/^(no|not|without|except|don'?t want)\s+/i, "").trim();
    if (name.length > 2 && !/music|songs|afrobeats|noise/i.test(name)) excludedArtists.push(name);
  }
  const like = text.match(/(?:like|sounds like|similar to|in the style of)\s+([A-Za-z][\w '&.-]{1,30})/i);
  const who = like?.[1]?.trim();
  if (who && !/something|anything|what/i.test(who)) artistRefs.push(who);

  if (genres.length === 0 && /nigerian|naija|lagos|9ja/i.test(lower)) uniqPush(genres, "Afrobeats");
  if (genres.length === 0) uniqPush(genres, "Afrobeats"); // Muse's home turf

  const summary = buildSummary({ moods, genres, occasion, familiarity });
  return intentSchema.parse({
    mood: moods.slice(0, 5),
    genres: genres.slice(0, 6),
    languages: languages.slice(0, 4),
    occasion,
    artistRefs: artistRefs.slice(0, 5),
    excludedArtists: excludedArtists.slice(0, 5),
    familiarity,
    query: null,
    summary,
  });
}

function buildSummary(p: {
  moods: string[];
  genres: string[];
  occasion: string | null;
  familiarity: Intent["familiarity"];
}): string {
  const bits: string[] = [];
  if (p.moods.length) bits.push(p.moods.slice(0, 2).join(" + ").toLowerCase());
  if (p.genres.length) bits.push(p.genres[0].toLowerCase());
  if (p.occasion) bits.push(`for ${p.occasion.replace("-", " ")}`);
  if (p.familiarity === "discovery") bits.push("from smaller artists");
  return bits.length ? `Looking for ${bits.join(" ")}.` : "Exploring the catalog.";
}

/** Bound + sanitise raw user text before it meets any model or prompt. */
export function sanitiseUserText(s: string): string {
  return s
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}
