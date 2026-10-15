import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatSessions, musicTracks, userFeedback } from "@/db/schema";
import { ApiError, handler, ok, readJson } from "@/lib/api";
import { feedbackSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export const POST = handler(async (req, rid) => {
  const user = await requireApiUser(rid);
  const body = feedbackSchema.parse(await readJson(req));

  const [track] = await db.select({ id: musicTracks.id }).from(musicTracks).where(eq(musicTracks.id, body.trackId)).limit(1);
  if (!track) throw new ApiError("VALIDATION", "That track is not in the catalog.", 422);

  if (body.sessionId) {
    const [s] = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(and(eq(chatSessions.id, body.sessionId), eq(chatSessions.userId, user.id)))
      .limit(1);
    if (!s) throw new ApiError("FORBIDDEN", "That conversation is not yours.", 403);
  }

  // One feedback row per user+track; kind is updatable (like ↔ not for me).
  const [row] = await db
    .insert(userFeedback)
    .values({ userId: user.id, trackId: body.trackId, sessionId: body.sessionId ?? null, kind: body.kind })
    .onConflictDoUpdate({
      target: [userFeedback.userId, userFeedback.trackId],
      set: { kind: body.kind, sessionId: body.sessionId ?? null },
    })
    .returning();
  return ok({ feedback: row }, rid, 201);
});

export const GET = handler(async (_req, rid) => {
  const user = await requireApiUser(rid);
  const rows = await db
    .select({ trackId: userFeedback.trackId, kind: userFeedback.kind })
    .from(userFeedback)
    .where(eq(userFeedback.userId, user.id));
  return ok({ feedback: rows }, rid);
});
