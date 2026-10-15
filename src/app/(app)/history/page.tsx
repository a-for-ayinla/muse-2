import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, chatSessions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { HistoryClient } from "@/components/app/history-client";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const user = await requireUser("/history");
  const rows = await db
    .select({
      session: chatSessions,
      messageCount: sql<number>`count(${chatMessages.id})::int`,
    })
    .from(chatSessions)
    .leftJoin(chatMessages, eq(chatMessages.sessionId, chatSessions.id))
    .where(eq(chatSessions.userId, user.id))
    .groupBy(chatSessions.id)
    .orderBy(desc(chatSessions.updatedAt))
    .limit(100);

  return (
    <HistoryClient
      initial={rows.map((r) => ({
        id: r.session.id,
        title: r.session.title,
        mode: r.session.mode,
        messageCount: r.messageCount,
        updatedAt: r.session.updatedAt.toISOString(),
      }))}
    />
  );
}
