import { z } from "zod";

/**
 * Creator plan generation. Every output is labelled a suggestion.
 * Muse never invents streams, chart positions, audience numbers or any
 * commercial stats — plans are structural drafts shaped from the artist's
 * own inputs plus catalog evidence (similar artists).
 */

export const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string().max(200),
  done: z.boolean().default(false),
});

export const creatorPlanSchema = z.object({
  kind: z.enum(["positioning", "release", "content", "promo", "full"]),
  summary: z.string().max(600),
  positioning: z
    .object({
      sound: z.string().max(300),
      audience: z.string().max(300),
      angle: z.string().max(300),
    })
    .nullable()
    .default(null),
  releaseChecklist: z.array(checklistItemSchema).max(12).default([]),
  contentIdeas: z.array(checklistItemSchema).max(12).default([]),
  promoChecklist: z.array(checklistItemSchema).max(12).default([]),
  similarArtists: z.array(z.string().max(80)).max(10).default([]),
  note: z.string().max(400),
});

export const creatorPlanInputSchema = z.object({
  planType: z.enum(["positioning", "release", "content", "promo", "full"]),
  artistName: z.string().trim().max(80).default(""),
  genres: z.array(z.string().max(30)).max(6).default([]),
  influences: z.array(z.string().max(60)).max(8).default([]),
  targetAudience: z.string().trim().max(300).default(""),
  goals: z.string().trim().max(500).default(""),
  bio: z.string().trim().max(1000).default(""),
  title: z.string().trim().min(1).max(100).optional(),
});

export type CreatorPlan = z.infer<typeof creatorPlanSchema>;
export type CreatorPlanInput = z.infer<typeof creatorPlanInputSchema>;

const uid = () => crypto.randomUUID().slice(0, 8);

function item(label: string) {
  return { id: uid(), label, done: false };
}

export function generateCreatorPlan(
  input: CreatorPlanInput,
  similarArtistsFromCatalog: string[],
): CreatorPlan {
  const name = input.artistName.trim() || "Your project";
  const genreLine = input.genres.length ? input.genres.join(" + ") : "your chosen genre";
  const influenceLine = input.influences.length
    ? `, in conversation with ${input.influences.slice(0, 3).join(", ")}`
    : "";
  const audience = input.targetAudience.trim() || "Nigerian listeners who already live in this sound";
  const kind = input.planType;

  const positioning = {
    sound: `${name} as a ${genreLine} artist${influenceLine}. One line you can say at a party: the exact feeling your songs leave people with.`,
    audience: `${audience}. Test it: play three songs for five people in that group and write down the words they use.`,
    angle: `Own one specific lane inside ${genreLine} — a place, a story, or a texture only you bring. Repeat it until people say it back to you.`,
  };

  const releaseChecklist = [
    item("Finish the artwork and double-check every credit line"),
    item("Pick a release date you can promote for two full weeks"),
    item("Cut three short teaser clips from the strongest hook"),
    item("Send the track to five playlist curators with a personal note"),
    item("Line up release-day posts with your inner circle"),
    item("Log what worked within one week of release"),
  ];

  const contentIdeas = [
    item(`A 30-second clip telling the story behind your latest ${genreLine} track`),
    item("A studio-to-stage post: same song, two settings"),
    item(`A fan-question post: ask what ${genreLine} lyric hits them hardest`),
    item("A behind-the-scenes of your writing process, phone quality is fine"),
    item("A collab tease with one artist in your lane"),
    item("A monthly recap: what you made, what you learned"),
  ];

  const promoChecklist = [
    item("Pitch five curators and three campus/community DJs"),
    item("Ask two creator friends for duet/stitch-style reactions"),
    item("Share one fan reaction (with permission) every week"),
    item("Perform the song live once and post the raw clip"),
    item("Keep a simple tracker: posts, replies, saves — your own numbers only"),
  ];

  const wants = (k: string) => kind === "full" || kind === k;

  const plan: CreatorPlan = {
    kind,
    summary: `${kind === "full" ? "Full campaign" : kind[0].toUpperCase() + kind.slice(1)} plan for ${name} — built from your profile. Everything here is a suggestion to test, not a prediction.`,
    positioning: wants("positioning") ? positioning : null,
    releaseChecklist: wants("release") ? releaseChecklist : [],
    contentIdeas: wants("content") ? contentIdeas : [],
    promoChecklist: wants("promo") ? promoChecklist : [],
    similarArtists: similarArtistsFromCatalog,
    note: "Muse never invents streams, chart positions or audience numbers. You bring the facts; these are structures to test.",
  };
  // Output is validated before it is allowed to persist.
  return creatorPlanSchema.parse(plan);
}
