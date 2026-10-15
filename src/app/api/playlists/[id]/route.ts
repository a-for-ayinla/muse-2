import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { musicTracks, playlists, playlistTracks } from "@/db/schema";
import { ApiError, handler, ok, readJson } from "@/lib/api";
import { patchPlaylistSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function loadOwned(id: string, userId: string) {
  const [row] = await db.select().from(playlists).where(eq(playlists.id, id)).limit(1);
  if (!row) throw new ApiError("NOT_FOUND", "Playlist not found.", 404);
  if (row.userId !== userId && row.visibility !== "public") {
    throw new ApiError("FORBIDDEN", "This playlist is private.", 403);
  }
  return row;
}

async function withTracks(p: typeof playlists.$inferSelect) {
  const rows = await db
    .select({ entry: playlistTracks, track: musicTracks })
    .from(playlistTracks)
    .innerJoin(musicTracks, eq(musicTracks.id, playlistTracks.trackId))
    .where(eq(playlistTracks.playlistId, p.id))
    .orderBy(asc(playlistTracks.position));
  return {
    ...p,
    tracks: rows.map((r) => ({ entryId: r.entry.id, position: r.entry.position, ...r.track })),
  };
}

export const GET = handler(async (_req, rid, ctx) => {
  const user = await requireApiUser(rid);
  const { id } = await (ctx as Ctx).params;
  const playlist = await loadOwned(id, user.id);
  return ok({ playlist: await withTracks(playlist), isOwner: playlist.userId === user.id }, rid);
});

export const PATCH = handler(async (req, rid, ctx) => {
  const user = await requireApiUser(rid);
  const { id } = await (ctx as Ctx).params;
  const playlist = await loadOwned(id, user.id);
  if (playlist.userId !== user.id) throw new ApiError("FORBIDDEN", "Only the owner can edit this playlist.", 403);

  const body = patchPlaylistSchema.parse(await readJson(req));

  if (body.title !== undefined || body.description !== undefined || body.visibility !== undefined) {
    await db
      .update(playlists)
      .set({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.visibility !== undefined ? { visibility: body.visibility } : {}),
        updatedAt: new Date(),
      })
      .where(eq(playlists.id, id));
  }

  if (body.removeTrackIds?.length) {
    await db
      .delete(playlistTracks)
      .where(and(eq(playlistTracks.playlistId, id), inArray(playlistTracks.trackId, body.removeTrackIds)));
  }

  if (body.addTrackIds?.length) {
    const found = await db
      .select({ id: musicTracks.id })
      .from(musicTracks)
      .where(inArray(musicTracks.id, body.addTrackIds));
    if (found.length !== new Set(body.addTrackIds).size) {
      throw new ApiError("VALIDATION", "Some tracks no longer exist in the catalog.", 422);
    }
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(${playlistTracks.position}), -1)::int` })
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, id));
    const existing = await db
      .select({ trackId: playlistTracks.trackId })
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, id));
    const have = new Set(existing.map((e) => e.trackId));
    const fresh = [...new Set(body.addTrackIds)].filter((t) => !have.has(t));
    if (fresh.length) {
      await db
        .insert(playlistTracks)
        .values(fresh.map((trackId, i) => ({ playlistId: id, trackId, position: max + 1 + i })));
    }
  }

  if (body.order) {
    // Reorder: normalise positions to the provided sequence; unknown ids rejected.
    const existing = await db
      .select({ trackId: playlistTracks.trackId })
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, id));
    const have = new Set(existing.map((e) => e.trackId));
    if (body.order.some((t) => !have.has(t))) {
      throw new ApiError("VALIDATION", "Reorder list contains tracks not in this playlist.", 422);
    }
    const seen = new Set<string>();
    const fullOrder = [...body.order, ...existing.map((e) => e.trackId)].filter((t) =>
      seen.has(t) ? false : (seen.add(t), true),
    );
    for (let i = 0; i < fullOrder.length; i++) {
      await db
        .update(playlistTracks)
        .set({ position: i })
        .where(and(eq(playlistTracks.playlistId, id), eq(playlistTracks.trackId, fullOrder[i])));
    }
  }

  // Normalise gaps after removals.
  if (body.removeTrackIds?.length && !body.order) {
    const rows = await db
      .select()
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, id))
      .orderBy(asc(playlistTracks.position));
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].position !== i) {
        await db.update(playlistTracks).set({ position: i }).where(eq(playlistTracks.id, rows[i].id));
      }
    }
  }

  const [fresh] = await db.select().from(playlists).where(eq(playlists.id, id)).limit(1);
  return ok({ playlist: await withTracks(fresh) }, rid);
});

export const DELETE = handler(async (_req, rid, ctx) => {
  const user = await requireApiUser(rid);
  const { id } = await (ctx as Ctx).params;
  const playlist = await loadOwned(id, user.id);
  if (playlist.userId !== user.id) {
    throw new ApiError("FORBIDDEN", "Only the owner can delete this playlist.", 403);
  }
  await db.delete(playlists).where(eq(playlists.id, id));
  return ok({ deleted: true }, rid);
});
