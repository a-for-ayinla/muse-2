import { eq } from "drizzle-orm";
import { db } from "@/db";
import { creatorProfiles } from "@/db/schema";
import { handler, ok, readJson } from "@/lib/api";
import { creatorProfileSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export const GET = handler(async (_req, rid) => {
  const user = await requireApiUser(rid);
  const [profile] = await db
    .select()
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, user.id))
    .limit(1);
  return ok({ profile: profile ?? null }, rid);
});

export const PUT = handler(async (req, rid) => {
  const user = await requireApiUser(rid);
  const body = creatorProfileSchema.parse(await readJson(req));
  const [profile] = await db
    .insert(creatorProfiles)
    .values({ userId: user.id, ...body })
    .onConflictDoUpdate({
      target: creatorProfiles.userId,
      set: { ...body, updatedAt: new Date() },
    })
    .returning();
  return ok({ profile }, rid);
});
