import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatSessions, playlists, userFeedback } from "@/db/schema";
import { providerStatus } from "@/lib/music";
import { requireUser } from "@/lib/auth";
import { ListenClient } from "@/components/app/listen-client";

export const metadata: Metadata = { title: "Listen" };

export default async function ListenPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const user = await requireUser("/listen");
  const { session } = await searchParams;

  const [recent, userPlaylists, feedback] = await Promise.all([
    db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, user.id))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(6),
    db
      .select({ id: playlists.id, title: playlists.title })
      .from(playlists)
      .where(eq(playlists.userId, user.id))
      .orderBy(desc(playlists.updatedAt))
      .limit(30),
    db
      .select({ trackId: userFeedback.trackId, kind: userFeedback.kind })
      .from(userFeedback)
      .where(eq(userFeedback.userId, user.id)),
  ]);

  return (
    <ListenClient
      provider={providerStatus()}
      userName={user.displayName}
      platform={user.preferredPlatform}
      recentSessions={recent.map((s) => ({ id: s.id, title: s.title, mode: s.mode, updatedAt: s.updatedAt.toISOString() }))}
      openSessionId={session ?? null}
      playlists={userPlaylists}
      feedback={Object.fromEntries(feedback.map((f) => [f.trackId, f.kind]))}
      suggested={[
        "Give me smooth Nigerian songs for a night drive",
        "I want something with alté vibes but from smaller artists",
        "Find music for an owambe",
        "Wetin dey sweet for Sunday?",
      ]}
    />
  );
}
