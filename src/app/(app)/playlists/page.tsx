import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { playlists, playlistTracks } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { providerStatus } from "@/lib/music";
import { PlaylistsClient } from "@/components/app/playlists-client";

export const metadata: Metadata = { title: "Playlists" };

export default async function PlaylistsPage() {
  const user = await requireUser("/playlists");
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

  return (
    <PlaylistsClient
      isDemo={providerStatus().isDemo}
      initial={rows.map((r) => ({
        id: r.playlist.id,
        title: r.playlist.title,
        description: r.playlist.description,
        visibility: r.playlist.visibility,
        trackCount: r.trackCount,
        updatedAt: r.playlist.updatedAt.toISOString(),
      }))}
    />
  );
}
