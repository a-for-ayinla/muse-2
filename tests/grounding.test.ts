import { describe, expect, it } from "vitest";
import { rankTracks } from "@/lib/ai/rank";
import { filterGroundedTrackIds, deterministicReply } from "@/lib/ai/respond";
import { extractIntent } from "@/lib/ai/intent";
import { isSafeExternalUrl } from "@/lib/api";
import { generateCreatorPlan, creatorPlanInputSchema, creatorPlanSchema } from "@/lib/ai/creator";
import type { NormalizedTrack } from "@/lib/music/provider";

const T = (over: Partial<NormalizedTrack>): NormalizedTrack => ({
  id: over.id ?? crypto.randomUUID(),
  provider: "demo",
  providerTrackId: "demo-x",
  title: "Title",
  artist: "Artist",
  album: "",
  artworkUrl: null,
  externalUrl: null,
  previewUrl: null,
  releaseDate: "2024-01-01",
  genres: [],
  languages: [],
  moods: [],
  occasions: [],
  ...over,
});

describe("recommendation grounding", () => {
  it("DROPS model-picked tracks that were never retrieved", () => {
    const retrieved = new Set(["a", "b"]);
    expect(filterGroundedTrackIds(["a", "z", "b", "y"], retrieved)).toEqual(["a", "b"]);
  });

  it("deterministic replies only reference retrieved tracks", () => {
    const intent = extractIntent("smooth songs for a night drive");
    const ranked = [T({ id: "1", moods: ["Smooth"] }), T({ id: "2", genres: ["Afro-soul"] })];
    const payload = deterministicReply(intent, ranked, { isDemo: true, userMessage: "hi" });
    for (const id of payload.trackIds) {
      expect(["1", "2"]).toContain(id);
    }
  });

  it("honest empty state when the catalog has nothing", () => {
    const intent = extractIntent("apala for a robot wedding");
    const payload = deterministicReply(intent, [], { isDemo: false, userMessage: "hi" });
    expect(payload.trackIds).toEqual([]);
    expect(payload.reply.toLowerCase()).toContain("won't invent");
  });

  it("ranks intent matches above irrelevant rows and respects feedback", () => {
    const intent = extractIntent("hype fuji for an owambe");
    const good = T({ id: "good", genres: ["Fuji"], moods: ["Hype"], occasions: ["owambe"] });
    const bad = T({ id: "bad", genres: ["Gospel"], moods: ["Worship"] });
    const rejected = T({ id: "rejected", genres: ["Fuji"], occasions: ["owambe"] });
    const ranked = rankTracks([bad, rejected, good], intent, {
      notForMeTrackIds: new Set(["rejected"]),
      dislikedArtists: new Set(),
    });
    expect(ranked[0].id).toBe("good");
    expect(ranked.find((t) => t.id === "rejected")).toBeUndefined();
  });
});

describe("external URL safety", () => {
  it("accepts http(s) and rejects anything else", () => {
    expect(isSafeExternalUrl("https://music.youtube.com/watch?v=x")).toBe(true);
    expect(isSafeExternalUrl("http://audiomack.com/song/x")).toBe(true);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeExternalUrl("not a url")).toBe(false);
    expect(isSafeExternalUrl(null)).toBe(false);
  });
});

describe("creator plans", () => {
  it("generates a schema-valid plan labelled as suggestion, with no invented stats", () => {
    const input = creatorPlanInputSchema.parse({
      planType: "full",
      artistName: "Test Artist",
      genres: ["Alté"],
    });
    const plan = generateCreatorPlan(input, ["Evidence Artist One", "Evidence Artist Two"]);
    expect(() => creatorPlanSchema.parse(plan)).not.toThrow();
    const blob = JSON.stringify(plan);
    // No fabricated quantitative claims (e.g. "100k streams", "50 playlists").
    expect(blob).not.toMatch(/\d+[\s,]*(k|m|million|thousand)?\s*(streams|listeners|followers|views)/i);
    expect(blob.toLowerCase()).toContain("suggestion");
    expect(plan.similarArtists).toEqual(["Evidence Artist One", "Evidence Artist Two"]);
  });

  it("rejects invalid plan types at the input boundary", () => {
    expect(() =>
      creatorPlanInputSchema.parse({ planType: "become-famous" }),
    ).toThrow();
  });
});
