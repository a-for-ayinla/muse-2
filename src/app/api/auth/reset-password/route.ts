import { handler, ok, readJson, ApiError } from "@/lib/api";
import { resetSchema } from "@/lib/validators";
import { consumeAuthToken, destroySession, hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const POST = handler(async (req, rid) => {
  const body = resetSchema.parse(await readJson(req));
  const userId = await consumeAuthToken(body.token, "password_reset");
  if (!userId) {
    throw new ApiError(
      "VALIDATION",
      "This reset link is invalid or has expired. Request a new one.",
      422,
    );
  }
  const passwordHash = await hashPassword(body.password);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
  // Invalidate every existing session for that account.
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await destroySession();
  return ok({ reset: true }, rid);
});
