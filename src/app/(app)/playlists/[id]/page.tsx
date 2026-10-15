import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { musicTracks, playlists, playlistTracks, userFeedback } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { providerStatus } from "@/lib/music";
import { PlaylistDetailClient } from "@/components/app/playlist-detail-client";

export const metadata: Metadata = { title: "Playlist" };

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id)).limit(1);
  if (!playlist) notFound();
  if (playlist.userId !== user.id && playlist.visibility !== "public") notFound();

  const rows = await db
    .select({ entry: playlistTracks, track: musicTracks })
    .from(playlistTracks)
    .innerJoin(musicTracks, eq(musicTracks.id, playlistTracks.trackId))
    .where(eq(playlistTracks.playlistId, id))
    .orderBy(asc(playlistTracks.position));

  const feedback =
    playlist.userId === user.id
      ? await db
          .select({ trackId: userFeedback.trackId, kind: userFeedback.kind })
          .from(userFeedback)
          .where(eq(userFeedback.userId, user.id))
      : [];

  return (
    <PlaylistDetailClient
      isDemo={providerStatus().isDemo}
      platform={user.preferredPlatform}
      isOwner={playlist.userId === user.id}
      playlist={{
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        visibility: playlist.visibility,
      }}
      tracks={rows.map((r) => ({
        id: r.track.id,
        title: r.track.title,
        artist: r.track.artist,
        album: r.track.album,
        genres: r.track.genres ?? [],
        moods: r.track.moods ?? [],
        externalUrl: r.track.externalUrl,
        provider: r.track.provider,
      }))}
      feedback={Object.fromEntries(feedback.map((f) => [f.trackId, f.kind]))}
    />
  );
}
