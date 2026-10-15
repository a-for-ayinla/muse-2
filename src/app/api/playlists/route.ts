import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { musicTracks, playlists, playlistTracks } from "@/db/schema";
import { ApiError, handler, ok, readJson } from "@/lib/api";
import { createPlaylistSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export const GET = handler(async (_req, rid) => {
  const user = await requireApiUser(rid);
  const rows = await db
    .select({
      playlist: playlists,
      trackCount: sql<number>`count(${playlistTracks.id})::int`,
    })
    .from(playlists)
    .leftJoin(playlistTracks, eq(playlistTracks.playlistId, playlists.id))
    .where(eq(playlists.userId, user.id))
    .groupBy(playlists.id)
    .orderBy(desc(playlists.updatedAt));
  return ok({ playlists: rows.map((r) => ({ ...r.playlist, trackCount: r.trackCount })) }, rid);
});

export const POST = handler(async (req, rid) => {
  const user = await requireApiUser(rid);
  const body = createPlaylistSchema.parse(await readJson(req));

  // Validate every client-supplied track id against the catalog.
  let validIds: string[] = [];
  if (body.trackIds.length) {
    const found = await db
      .select({ id: musicTracks.id })
      .from(musicTracks)
      .where(inArray(musicTracks.id, body.trackIds));
    const foundSet = new Set(found.map((f) => f.id));
    const invalid = body.trackIds.filter((id) => !foundSet.has(id));
    if (invalid.length) {
      throw new ApiError("VALIDATION", "Some tracks no longer exist in the catalog.", 422);
    }
    validIds = [...new Set(body.trackIds)];
  }

  const [playlist] = await db
    .insert(playlists)
    .values({
      userId: user.id,
      title: body.title,
      description: body.description,
      source: "manual",
    })
    .returning();
  if (validIds.length) {
    await db.insert(playlistTracks).values(
      validIds.map((trackId, i) => ({ playlistId: playlist.id, trackId, position: i })),
    );
  }
  return ok({ playlist: { ...playlist, trackCount: validIds.length } }, rid, 201);
});
