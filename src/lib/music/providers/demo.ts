import "server-only";
import { and, arrayOverlaps, eq, ilike, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { musicTracks } from "@/db/schema";
import type { CatalogPage, CatalogQuery, MusicProvider, NormalizedTrack } from "../provider";

/**
 * DEMO PROVIDER — explicit flag only (MUSIC_PROVIDERS=demo).
 * A clearly fictional sample catalog used to exercise the full product
 * honestly: the UI shows a "Demo data" banner, names are invented, and
 * no listening links or artwork are fabricated (externalUrl stays null;
 * the UI offers a clearly-labelled platform *search* link instead).
 * Never mixed with or presented as real catalog results.
 */

type DemoSeed = {
  title: string;
  artist: string;
  album: string;
  releaseDate: string;
  genres: string[];
  languages: string[];
  moods: string[];
  occasions: string[];
};

const SEED: DemoSeed[] = [
  // Afrobeats
  { title: "Mainland Motion", artist: "Temi West", album: "Lagos Letters", releaseDate: "2024-03-01", genres: ["Afrobeats"], languages: ["English", "Pidgin"], moods: ["Upbeat", "Hype"], occasions: ["party", "street"] },
  { title: "Danfo Daydream", artist: "Temi West", album: "Lagos Letters", releaseDate: "2023-11-14", genres: ["Afrobeats", "Afro-fusion"], languages: ["Pidgin"], moods: ["Smooth", "Reflective"], occasions: ["night-drive", "chill"] },
  { title: "Gbedu Weather", artist: "Kappa Gold", album: "Sunroof Season", releaseDate: "2024-06-21", genres: ["Afrobeats"], languages: ["Pidgin", "Yoruba"], moods: ["Party", "Hype"], occasions: ["owambe", "party"] },
  { title: "Soft Landing", artist: "Ada Bloom", album: "Petal & Bass", releaseDate: "2024-01-19", genres: ["Afrobeats", "Afro-soul"], languages: ["English"], moods: ["Smooth", "Romantic"], occasions: ["night-drive", "date"] },
  { title: "Owambe Central", artist: "Kappa Gold", album: "Sunroof Season", releaseDate: "2024-08-02", genres: ["Afrobeats"], languages: ["Pidgin", "Yoruba"], moods: ["Party", "Upbeat"], occasions: ["owambe", "party"] },
  { title: "Easy Tiger", artist: "Nero Chisom", album: "Slow Burn", releaseDate: "2022-05-06", genres: ["Afrobeats", "Afro-fusion"], languages: ["English", "Igbo"], moods: ["Chill", "Sweet"], occasions: ["sunday", "chill"] },
  // Alté
  { title: "Neon Agbero", artist: "Sade Vortex", album: "Violet Traffic", releaseDate: "2023-09-08", genres: ["Alté"], languages: ["English", "Pidgin"], moods: ["Reflective", "Hype"], occasions: ["night-drive", "street"] },
  { title: "Velvet Machete", artist: "Sade Vortex", album: "Violet Traffic", releaseDate: "2023-04-28", genres: ["Alté", "Afro-fusion"], languages: ["English"], moods: ["Sweet", "Smooth"], occasions: ["chill", "date"] },
  { title: "Basement Palm Wine", artist: "The Lagoon Club", album: "Smallgod Tapes", releaseDate: "2022-10-31", genres: ["Alté"], languages: ["Pidgin"], moods: ["Chill", "Reflective"], occasions: ["night-drive", "chill"] },
  { title: "Glue Stick Romance", artist: "The Lagoon Club", album: "Smallgod Tapes", releaseDate: "2024-02-14", genres: ["Alté"], languages: ["English", "Pidgin"], moods: ["Romantic", "Sweet"], occasions: ["date"] },
  { title: "Gra Gra Free", artist: "Ola Nebula", album: "Quiet Riot", releaseDate: "2021-07-16", genres: ["Alté", "Afro-soul"], languages: ["Yoruba", "English"], moods: ["Chill", "Sweet"], occasions: ["sunday", "study"] },
  { title: "Patchwork Jeans", artist: "Ola Nebula", album: "Quiet Riot", releaseDate: "2023-12-01", genres: ["Alté"], languages: ["Pidgin"], moods: ["Hype", "Sweet"], occasions: ["street"] },
  // Highlife
  { title: "Palm Grove Serenade", artist: "Chief Ebuka & The Seven Stars", album: "Golden Era Returns", releaseDate: "2020-12-25", genres: ["Highlife"], languages: ["Igbo"], moods: ["Sweet", "Upbeat"], occasions: ["owambe", "wedding"] },
  { title: "Enugu Moonlight", artist: "Chief Ebuka & The Seven Stars", album: "Golden Era Returns", releaseDate: "2021-08-13", genres: ["Highlife", "Juju"], languages: ["Igbo", "English"], moods: ["Romantic", "Reflective"], occasions: ["night-drive", "wedding"] },
  { title: "Guitar Parlour", artist: "Ngozi Strings", album: "Sunday Best", releaseDate: "2022-04-17", genres: ["Highlife"], languages: ["English", "Igbo"], moods: ["Chill", "Sweet"], occasions: ["sunday", "chill"] },
  // Fuji
  { title: "Were Junction", artist: "Alhaji Musiliu Fresh", album: "New Dawn Fuji", releaseDate: "2023-05-26", genres: ["Fuji"], languages: ["Yoruba"], moods: ["Hype", "Party"], occasions: ["owambe", "street"] },
  { title: "Ojuelegba Thunder", artist: "Alhaji Musiliu Fresh", album: "New Dawn Fuji", releaseDate: "2024-04-05", genres: ["Fuji", "Afrobeats"], languages: ["Yoruba", "Pidgin"], moods: ["Hype", "Upbeat"], occasions: ["party", "street"] },
  { title: "Talazo Morning", artist: "Sikiru Vibes", album: "Island Percussion", releaseDate: "2021-11-11", genres: ["Fuji"], languages: ["Yoruba"], moods: ["Upbeat", "Focused"], occasions: ["workout", "street"] },
  // Juju
  { title: "Sunny Rhapsody", artist: "King Sunny Ade Jr.", album: "Modern Strings", releaseDate: "2022-09-30", genres: ["Juju"], languages: ["Yoruba"], moods: ["Upbeat", "Sweet"], occasions: ["owambe", "wedding"] },
  { title: "Philosopher's Dance", artist: "Prince Adebayo Light", album: "Talking Drum Diaries", releaseDate: "2020-06-12", genres: ["Juju", "Highlife"], languages: ["Yoruba"], moods: ["Sweet", "Reflective"], occasions: ["sunday", "owambe"] },
  // Apala
  { title: "Wooden Wisdom", artist: "Ayinde Heritage", album: "Sakara Roots", releaseDate: "2019-10-04", genres: ["Apala"], languages: ["Yoruba"], moods: ["Reflective", "Focused"], occasions: ["sunday", "study"] },
  { title: "Grandfather's Chair", artist: "Ayinde Heritage", album: "Sakara Roots", releaseDate: "2021-03-19", genres: ["Apala", "Fuji"], languages: ["Yoruba"], moods: ["Reflective", "Sweet"], occasions: ["sunday"] },
  // Amapiano
  { title: "Yaba to Joburg", artist: "DJ Palm Groove", album: "Log Drum Lagos", releaseDate: "2024-05-10", genres: ["Amapiano"], languages: ["Pidgin"], moods: ["Party", "Hype"], occasions: ["party", "night-drive"] },
  { title: "Midnight Shakers", artist: "DJ Palm Groove", album: "Log Drum Lagos", releaseDate: "2023-07-21", genres: ["Amapiano", "Afrobeats"], languages: ["Pidgin", "English"], moods: ["Party", "Smooth"], occasions: ["night-drive", "party"] },
  { title: "Bassline Calabar", artist: "Naya Frost", album: "Piano Sunrise", releaseDate: "2024-09-27", genres: ["Amapiano"], languages: ["English"], moods: ["Smooth", "Chill"], occasions: ["chill", "night-drive"] },
  // Afro-fusion
  { title: "River Niger Echoes", artist: "Zara Okonkwo", album: "Two Rivers", releaseDate: "2023-02-17", genres: ["Afro-fusion", "Afro-soul"], languages: ["English", "Igbo"], moods: ["Reflective", "Sweet"], occasions: ["night-drive", "study"] },
  { title: "Paint the Sky Ankara", artist: "Zara Okonkwo", album: "Two Rivers", releaseDate: "2024-07-12", genres: ["Afro-fusion"], languages: ["English", "Pidgin"], moods: ["Upbeat", "Sweet"], occasions: ["party", "owambe"] },
  { title: "Streetlight Serenade", artist: "Femi Stardust", album: "Metropolis Lullabies", releaseDate: "2022-08-26", genres: ["Afro-fusion", "Alté"], languages: ["English", "Yoruba"], moods: ["Smooth", "Romantic"], occasions: ["night-drive", "date"] },
  { title: "Market Day Hymn", artist: "Femi Stardust", album: "Metropolis Lullabies", releaseDate: "2023-10-06", genres: ["Afro-fusion"], languages: ["Pidgin", "Yoruba"], moods: ["Upbeat", "Sweet"], occasions: ["street", "sunday"] },
  // Afro-soul
  { title: "Honey & Harmattan", artist: "Amara Sol", album: "Golden Hour Gospelless", releaseDate: "2023-01-27", genres: ["Afro-soul"], languages: ["English"], moods: ["Smooth", "Romantic"], occasions: ["date", "chill"] },
  { title: "Quiet Fire", artist: "Amara Sol", album: "Golden Hour Gospelless", releaseDate: "2024-04-19", genres: ["Afro-soul", "Alté"], languages: ["English", "Pidgin"], moods: ["Chill", "Reflective"], occasions: ["sunday", "night-drive"] },
  { title: "Letters to Surulere", artist: "Dayo Rivers", album: "Blue Keke", releaseDate: "2021-05-14", genres: ["Afro-soul"], languages: ["English", "Yoruba"], moods: ["Reflective", "Smooth"], occasions: ["night-drive", "study"] },
  // Gospel
  { title: "Hallelujah Traffic", artist: "Grace Adeyemi & The Choirboyz", album: "Lagos Praise Rise", releaseDate: "2024-12-25", genres: ["Gospel"], languages: ["English", "Yoruba"], moods: ["Worship", "Upbeat"], occasions: ["sunday", "praise"] },
  { title: "New Dawn Praise", artist: "Grace Adeyemi & The Choirboyz", album: "Lagos Praise Rise", releaseDate: "2023-04-09", genres: ["Gospel", "Highlife"], languages: ["Yoruba", "Igbo"], moods: ["Worship", "Sweet"], occasions: ["praise", "sunday"] },
  { title: "Mercy Road", artist: "Psalmist Ife", album: "Morning Dew", releaseDate: "2022-12-18", genres: ["Gospel"], languages: ["English"], moods: ["Worship", "Reflective"], occasions: ["praise", "sunday"] },
  // Extra Pidgin-forward & Hausa
  { title: "Wetin Dey My Mind", artist: "Small Pepper", album: "No Gree Tape", releaseDate: "2024-10-11", genres: ["Afrobeats", "Alté"], languages: ["Pidgin"], moods: ["Hype", "Sweet"], occasions: ["street", "party"] },
  { title: "Kano Sunset Riddim", artist: "Fatima Zahra Beats", album: "Sahel Grooves", releaseDate: "2023-08-04", genres: ["Afro-fusion", "Afrobeats"], languages: ["Hausa"], moods: ["Smooth", "Sweet"], occasions: ["night-drive", "sunday"] },
  { title: "Jollof & Jealousy", artist: "Small Pepper", album: "No Gree Tape", releaseDate: "2024-03-29", genres: ["Afrobeats"], languages: ["Pidgin", "English"], moods: ["Party", "Upbeat"], occasions: ["owambe", "party"] },
  { title: "Chop Life Gently", artist: "Nero Chisom", album: "Slow Burn", releaseDate: "2024-11-22", genres: ["Afro-soul", "Afrobeats"], languages: ["Pidgin", "English"], moods: ["Chill", "Sweet"], occasions: ["sunday", "chill"] },
  // Smooth night-drive pack
  { title: "Third Mainland Slow", artist: "Dayo Rivers", album: "Blue Keke", releaseDate: "2023-06-02", genres: ["Afro-soul", "Afro-fusion"], languages: ["English"], moods: ["Smooth", "Chill"], occasions: ["night-drive"] },
  { title: "Brake Light Glow", artist: "Naya Frost", album: "Piano Sunrise", releaseDate: "2023-11-03", genres: ["Amapiano", "Alté"], languages: ["Pidgin"], moods: ["Smooth", "Chill"], occasions: ["night-drive", "chill"] },
  { title: "Two AM in Ikoyi", artist: "Amara Sol", album: "Golden Hour Gospelless", releaseDate: "2024-08-30", genres: ["Afro-soul"], languages: ["English"], moods: ["Smooth", "Romantic"], occasions: ["night-drive", "date"] },
  // Study / focus pack
  { title: "Rain on Zinc Roof", artist: "The Lagoon Club", album: "Smallgod Tapes", releaseDate: "2022-02-25", genres: ["Alté"], languages: ["English"], moods: ["Focused", "Chill"], occasions: ["study", "chill"] },
  { title: "Library of Drums", artist: "Prince Adebayo Light", album: "Talking Drum Diaries", releaseDate: "2021-09-17", genres: ["Juju", "Apala"], languages: ["Yoruba"], moods: ["Focused", "Reflective"], occasions: ["study"] },
  { title: "Coffee and K leg", artist: "Ola Nebula", album: "Quiet Riot", releaseDate: "2024-05-03", genres: ["Afro-fusion"], languages: ["English", "Pidgin"], moods: ["Focused", "Sweet"], occasions: ["study", "chill"] },
  // Workout / hype pack
  { title: "Ginger My Body", artist: "Kappa Gold", album: "Sunroof Season", releaseDate: "2024-01-05", genres: ["Afrobeats", "Fuji"], languages: ["Pidgin"], moods: ["Hype", "Upbeat"], occasions: ["workout", "street"] },
  { title: "No Brake", artist: "DJ Palm Groove", album: "Log Drum Lagos", releaseDate: "2023-09-15", genres: ["Amapiano"], languages: ["Pidgin"], moods: ["Hype", "Party"], occasions: ["workout", "party"] },
  { title: "Level Don Change", artist: "Temi West", album: "Lagos Letters", releaseDate: "2024-09-13", genres: ["Afrobeats"], languages: ["Pidgin", "English"], moods: ["Hype", "Upbeat"], occasions: ["workout", "street"] },
  // Wedding
  { title: "Aso Ebi Sway", artist: "Ngozi Strings", album: "Sunday Best", releaseDate: "2023-12-29", genres: ["Highlife", "Afrobeats"], languages: ["Igbo", "English"], moods: ["Sweet", "Romantic"], occasions: ["wedding", "owambe"] },
  { title: "Load the Guitar Case", artist: "King Sunny Ade Jr.", album: "Modern Strings", releaseDate: "2024-02-09", genres: ["Juju"], languages: ["Yoruba"], moods: ["Upbeat", "Sweet"], occasions: ["wedding", "party"] },
];

let seeded: Promise<void> | null = null;

/** Idempotent seed — safe to call on every search; inserts only when empty. */
function ensureSeed(): Promise<void> {
  if (!seeded) {
    seeded = (async () => {
      const existing = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(musicTracks)
        .where(eq(musicTracks.provider, "demo"));
      if ((existing[0]?.n ?? 0) > 0) return;
      await db
        .insert(musicTracks)
        .values(
          SEED.map((t, i) => ({
            provider: "demo",
            providerTrackId: `demo-${String(i + 1).padStart(3, "0")}`,
            title: t.title,
            artist: t.artist,
            album: t.album,
            artworkUrl: null,
            externalUrl: null,
            previewUrl: null,
            releaseDate: t.releaseDate,
            genres: t.genres,
            languages: t.languages,
            moods: t.moods,
            occasions: t.occasions,
            metadataSource: "demo-seed",
            verifiedAt: new Date(),
          })),
        )
        .onConflictDoNothing();
    })().catch((e) => {
      seeded = null; // allow retry
      throw e;
    });
  }
  return seeded;
}

function toNormalized(r: typeof musicTracks.$inferSelect): NormalizedTrack {
  return {
    id: r.id,
    provider: r.provider,
    providerTrackId: r.providerTrackId,
    title: r.title,
    artist: r.artist,
    album: r.album,
    artworkUrl: r.artworkUrl,
    externalUrl: r.externalUrl,
    previewUrl: r.previewUrl,
    releaseDate: r.releaseDate,
    genres: r.genres ?? [],
    languages: r.languages ?? [],
    moods: r.moods ?? [],
    occasions: r.occasions ?? [],
  };
}

export const demoProvider: MusicProvider = {
  name: "demo",
  attribution: "Demo data — fictional sample catalog",
  isDemo: true,

  async search(q: CatalogQuery): Promise<CatalogPage> {
    await ensureSeed();
    const conds = [eq(musicTracks.provider, "demo")];
    if (q.genres?.length) conds.push(arrayOverlaps(musicTracks.genres, q.genres));
    if (q.moods?.length) conds.push(arrayOverlaps(musicTracks.moods, q.moods));
    if (q.languages?.length) conds.push(arrayOverlaps(musicTracks.languages, q.languages));
    if (q.occasions?.length) conds.push(arrayOverlaps(musicTracks.occasions, q.occasions));
    if (q.text) {
      const like = `%${q.text.slice(0, 80)}%`;
      conds.push(or(ilike(musicTracks.title, like), ilike(musicTracks.artist, like), ilike(musicTracks.album, like))!);
    }
    if (q.artistRefs?.length) {
      conds.push(or(...q.artistRefs.slice(0, 5).map((a) => ilike(musicTracks.artist, `%${a.slice(0, 40)}%`)))!);
    }
    const where = and(...conds);
    let rows = await db.select().from(musicTracks).where(where).limit(200);
    if (q.excludedArtists?.length) {
      const banned = q.excludedArtists.map((a) => a.toLowerCase());
      rows = rows.filter((r) => !banned.some((b) => r.artist.toLowerCase().includes(b)));
    }
    // Familiarity is expressed through ordering only — all rows are real catalog rows.
    rows.sort((a, b) =>
      q.familiarity === "discovery"
        ? a.providerTrackId < b.providerTrackId
          ? -1
          : 1
        : a.releaseDate! < b.releaseDate!
          ? 1
          : -1,
    );
    const total = rows.length;
    const slice = rows.slice(q.offset ?? 0, (q.offset ?? 0) + Math.min(q.limit, 25));
    return {
      tracks: slice.map(toNormalized),
      total,
      provider: "demo",
      providerAttribution: demoProvider.attribution,
      isDemo: true,
    };
  },

  async similarArtists(genres: string[], exclude: string[], limit: number): Promise<string[]> {
    await ensureSeed();
    const conds = [eq(musicTracks.provider, "demo")];
    if (genres.length) conds.push(arrayOverlaps(musicTracks.genres, genres));
    if (exclude.length) {
      // exclude by exact-ish artist name
      const rows = await db.selectDistinct({ artist: musicTracks.artist }).from(musicTracks).where(and(...conds));
      const banned = exclude.map((e) => e.toLowerCase());
      return rows.map((r) => r.artist).filter((a) => !banned.some((b) => a.toLowerCase().includes(b))).slice(0, limit);
    }
    const rows = await db
      .selectDistinct({ artist: musicTracks.artist })
      .from(musicTracks)
      .where(and(notInArray(musicTracks.artist, ["__never__"]), ...conds));
    return rows.map((r) => r.artist).slice(0, limit);
  },
};
