import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, chatSessions, creatorProfiles, userFeedback } from "@/db/schema";
import { ApiError, fail, handler, ok, readJson } from "@/lib/api";
import { chatRequestSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { extractIntent, sanitiseUserText } from "@/lib/ai/intent";
import { rankTracks } from "@/lib/ai/rank";
import { creatorChatReply, deterministicReply, refineWithLLM } from "@/lib/ai/respond";
import { CatalogError, getMusicProvider } from "@/lib/music";
import { providerStatus } from "@/lib/music";
import { aiConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

function titleFrom(message: string): string {
  const t = message.replace(/\s+/g, " ").trim();
  return t.length > 60 ? t.slice(0, 57) + "…" : t;
}

export const POST = handler(async (req, rid) => {
  const user = await requireApiUser(rid);
  const rl = await rateLimit(`chat:${user.id}`);
  if (!rl.allowed) throw new ApiError("RATE_LIMITED", "Easy! Too many messages at once.", 429);

  const body = chatRequestSchema.parse(await readJson(req));
  const message = sanitiseUserText(body.message);
  if (!message) throw new ApiError("VALIDATION", "Say something first.", 422);

  // --- session: reuse (with ownership check) or create ---
  let sessionId = body.sessionId;
  if (sessionId) {
    const owned = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, user.id)))
      .limit(1);
    if (owned.length === 0) throw new ApiError("FORBIDDEN", "That conversation is not yours.", 403);
  } else {
    const [created] = await db
      .insert(chatSessions)
      .values({ userId: user.id, title: titleFrom(message), mode: body.mode })
      .returning({ id: chatSessions.id });
    sessionId = created.id;
  }

  await db.insert(chatMessages).values({
    sessionId,
    userId: user.id,
    role: "user",
    content: message,
  });

  const provider = getMusicProvider();

  /* ---------------- CREATE mode ---------------- */
  if (body.mode === "create") {
    const [profile] = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, user.id))
      .limit(1);
    const payload = creatorChatReply(message, profile?.artistName || null);
    await db.insert(chatMessages).values({
      sessionId,
      userId: user.id,
      role: "assistant",
      content: payload.reply,
    });
    await db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, sessionId));
    return ok(
      {
        sessionId,
        reply: payload.reply,
        intent: null,
        tracks: [],
        followUps: payload.followUps,
        provider: providerStatus(),
        usedLLM: false,
        label: "Suggestion",
      },
      rid,
    );
  }

  /* ---------------- LISTEN mode ---------------- */
  const intent = extractIntent(message);
  try {
    const page = await provider.search({
      genres: intent.genres,
      moods: intent.mood,
      languages: intent.languages,
      occasions: intent.occasion ? [intent.occasion] : [],
      artistRefs: intent.artistRefs,
      excludedArtists: intent.excludedArtists,
      familiarity: intent.familiarity,
      text: intent.query ?? undefined,
      limit: 25,
    });

    // Recommendation feedback shapes results: hide not-for-me tracks + artists.
    const fb = await db
      .select({ trackId: userFeedback.trackId, kind: userFeedback.kind })
      .from(userFeedback)
      .where(eq(userFeedback.userId, user.id));
    const notForMe = new Set(fb.filter((f) => f.kind === "not_for_me").map((f) => f.trackId));
    const liked = new Set(fb.filter((f) => f.kind === "like").map((f) => f.trackId));

    const dislikedTrackIds = notForMe;
    const dislikedArtists = new Set<string>();
    // derive disliked artists from catalog rows the user rejected
    for (const t of page.tracks) if (dislikedTrackIds.has(t.id)) dislikedArtists.add(t.artist.toLowerCase());

    const ranked = rankTracks(page.tracks, intent, {
      notForMeTrackIds: notForMe,
      dislikedArtists,
    });
    // liked tracks bubble up (still from retrieved results only)
    ranked.sort((a, b) => Number(liked.has(b.id)) - Number(liked.has(a.id)));

    const draft = deterministicReply(intent, ranked, { isDemo: page.isDemo, userMessage: message });
    const { payload, usedLLM } = await refineWithLLM(draft, intent, ranked, message);
    const byId = new Map(ranked.map((t) => [t.id, t]));
    const finalTracks = payload.trackIds.map((id) => byId.get(id)).filter(Boolean);

    await db.insert(chatMessages).values({
      sessionId,
      userId: user.id,
      role: "assistant",
      content: payload.reply,
      intent,
      tracks: { ids: finalTracks.map((t) => t!.id), provider: page.provider },
    });
    await db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, sessionId));

    return ok(
      {
        sessionId,
        reply: payload.reply,
        intent,
        tracks: finalTracks,
        followUps: payload.followUps,
        provider: { name: page.provider, isDemo: page.isDemo, attribution: page.providerAttribution, configured: true },
        usedLLM,
        aiConfigured: aiConfigured(),
      },
      rid,
    );
  } catch (e) {
    if (e instanceof CatalogError && e.kind === "UNAVAILABLE") {
      const honest =
        "My music catalog isn't connected yet (MUSIC_PROVIDERS=none), so I can't pull real songs — and I won't invent any. Once a provider is configured, ask me again and I'll search it for real.";
      await db.insert(chatMessages).values({
        sessionId,
        userId: user.id,
        role: "assistant",
        content: honest,
        intent,
      });
      return fail("CATALOG_UNAVAILABLE", honest, rid);
    }
    console.error(`[muse] ${rid} retrieval failure`, e);
    return fail("PROVIDER_ERROR", "The catalog stumbled. Try that again shortly.", rid);
  }
});

/** Load a session's messages (ownership enforced). */
export const GET = handler(async (req, rid) => {
  const user = await requireApiUser(rid);
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  if (sessionId) {
    const owned = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, user.id)))
      .limit(1);
    if (owned.length === 0) throw new ApiError("NOT_FOUND", "Conversation not found.", 404);
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(200);

    // Rehydrate assistant track snapshots into full catalog rows when possible.
    const allIds = messages
      .flatMap((m) => ((m.tracks as { ids?: string[] } | null)?.ids ?? []))
      .slice(0, 60);
    let trackMap = new Map<string, unknown>();
    if (allIds.length) {
      const { musicTracks } = await import("@/db/schema");
      const { inArray } = await import("drizzle-orm");
      const rows = await db.select().from(musicTracks).where(inArray(musicTracks.id, allIds));
      trackMap = new Map(rows.map((r) => [r.id, r]));
    }
    return ok(
      {
        session: owned[0],
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
          tracks: ((m.tracks as { ids?: string[] } | null)?.ids ?? [])
            .map((id) => trackMap.get(id))
            .filter(Boolean),
        })),
        provider: providerStatus(),
      },
      rid,
    );
  }
  const sessionsList = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, user.id))
    .orderBy(chatSessions.updatedAt)
    .limit(50);
  return ok({ sessions: sessionsList.reverse(), provider: providerStatus() }, rid);
});
