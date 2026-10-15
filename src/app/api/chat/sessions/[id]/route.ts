import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { ApiError, handler, ok } from "@/lib/api";
import { requireApiUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = handler(async (_req, rid, ctx) => {
  const user = await requireApiUser(rid);
  const { id } = await (ctx as Ctx).params;
  const [owned] = await db
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(and(eq(chatSessions.id, id), eq(chatSessions.userId, user.id)))
    .limit(1);
  if (!owned) throw new ApiError("NOT_FOUND", "Conversation not found.", 404);
  await db.delete(chatSessions).where(eq(chatSessions.id, id));
  return ok({ deleted: true }, rid);
});
