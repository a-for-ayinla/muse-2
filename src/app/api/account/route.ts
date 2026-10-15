import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, handler, ok, readJson } from "@/lib/api";
import { deleteAccountSchema, profileUpdateSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth-helpers";
import { destroySession, verifyPassword } from "@/lib/auth";
import { publicUser } from "../auth/signup/route";

export const dynamic = "force-dynamic";

export const PUT = handler(async (req, rid) => {
  const user = await requireApiUser(rid);
  const body = profileUpdateSchema.parse(await readJson(req));
  const [updated] = await db
    .update(users)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning();
  return ok({ user: publicUser(updated) }, rid);
});

/** Delete account: requires the password; cascades every owned row. */
export const DELETE = handler(async (req, rid) => {
  const user = await requireApiUser(rid);
  const body = deleteAccountSchema.parse(await readJson(req));
  if (!(await verifyPassword(body.password, user.passwordHash))) {
    throw new ApiError("FORBIDDEN", "Password is incorrect.", 403);
  }
  await destroySession();
  await db.delete(users).where(eq(users.id, user.id));
  return ok({ deleted: true }, rid);
});
