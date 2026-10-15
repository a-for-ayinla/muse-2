import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { handler, ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

/** Delete ALL conversations ("delete all conversations" in settings/history). */
export const DELETE = handler(async (_req, rid) => {
  const user = await requireApiUser(rid);
  await db.delete(chatSessions).where(eq(chatSessions.userId, user.id));
  return ok({ deleted: true }, rid);
});
