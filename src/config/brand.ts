/**
 * MUSE brand tokens — the single source of truth.
 * The visual identity is LOCKED. Change values here only; never restyle
 * components around new tokens without explicit brand approval.
 */
export const brand = {
  name: "Muse",
  wordmark: "muse", // always lowercase
  tagline: "Your sound. Your culture. Your AI.",
  audience: "Nigerian music listeners, independent artists, DJs and creators.",
  disclaimer:
    "Muse is a music companion, not a streaming service. Music opens on the platform you choose. AI suggestions for artists are ideas to test, not predictions.",
  colors: {
    ink: "#0E0F0C",
    panel: "#1A1C17",
    deep: "#16180F",
    raised: "#23261F",
    border: "#34372C",
    cream: "#F4EFE4",
    soft: "#C9CBBB",
    muted: "#B4B6A6",
    dim: "#8E9081",
    lime: "#C8FF2E", // main accent — always with ink text on top
    hibiscus: "#FF6B9A", // small details only, never large fills
    // semantic (separate from accent; pass contrast on ink)
    danger: "#FF8A85",
    dangerOnCream: "#B3271E",
    success: "#45E3A0",
    successOnCream: "#0F7B4D",
  },
  fonts: {
    headline: "Bagel Fat One", // wordmark, headlines, stickers, big numbers, mode toggle
    body: "Fredoka", // everything else
  },
  genres: [
    "Afrobeats",
    "Alté",
    "Highlife",
    "Fuji",
    "Juju",
    "Apala",
    "Amapiano",
    "Afro-fusion",
    "Afro-soul",
    "Gospel",
  ],
  moods: [
    "Smooth",
    "Chill",
    "Upbeat",
    "Romantic",
    "Reflective",
    "Party",
    "Worship",
    "Hype",
    "Focused",
    "Sweet",
  ],
  languages: ["English", "Pidgin", "Yoruba", "Igbo", "Hausa"],
  platforms: [
    { id: "any", label: "Any platform" },
    { id: "apple", label: "Apple Music" },
    { id: "spotify", label: "Spotify" },
    { id: "youtube", label: "YouTube Music" },
    { id: "audiomack", label: "Audiomack" },
    { id: "boomplay", label: "Boomplay" },
  ],
} as const;

export type Genre = (typeof brand.genres)[number];
export type Mood = (typeof brand.moods)[number];
