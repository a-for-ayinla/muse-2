import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { creatorPlans, creatorProfiles } from "@/db/schema";
import { ApiError, fail, handler, ok, readJson } from "@/lib/api";
import { creatorPlanInputSchema, generateCreatorPlan } from "@/lib/ai/creator";
import { requireApiUser } from "@/lib/auth-helpers";
import { CatalogError, getMusicProvider } from "@/lib/music";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export const GET = handler(async (_req, rid) => {
  const user = await requireApiUser(rid);
  const plans = await db
    .select()
    .from(creatorPlans)
    .where(eq(creatorPlans.userId, user.id))
    .orderBy(desc(creatorPlans.updatedAt))
    .limit(50);
  return ok({ plans }, rid);
});

export const POST = handler(async (req, rid) => {
  const user = await requireApiUser(rid);
  const rl = await rateLimit(`plans:${user.id}`);
  if (!rl.allowed) throw new ApiError("RATE_LIMITED", "Too many plans at once. Breathe.", 429);

  const body = creatorPlanInputSchema.parse(await readJson(req));

  // Similar artists come ONLY from catalog evidence.
  let similar: string[] = [];
  let catalogNote: string | null = null;
  try {
    similar = await getMusicProvider().similarArtists(
      body.genres,
      body.artistName ? [body.artistName] : [],
      6,
    );
  } catch (e) {
    if (e instanceof CatalogError) {
      catalogNote = "No catalog connected — similar artists need catalog evidence and are omitted.";
    } else {
      return fail("PROVIDER_ERROR", "The catalog stumbled while checking similar artists.", rid);
    }
  }

  // Generate + validate the plan FIRST; persist only after success.
  const plan = generateCreatorPlan(body, similar);
  if (catalogNote) plan.note = `${plan.note} ${catalogNote}`;

  const title =
    body.title ??
    `${plan.kind === "full" ? "Full campaign" : plan.kind[0].toUpperCase() + plan.kind.slice(1)} plan — ${
      body.artistName || "my project"
    }`;

  const [saved] = await db
    .insert(creatorPlans)
    .values({ userId: user.id, title, planType: body.planType, inputs: body, plan })
    .returning();

  // Touch the creator profile if the artist name is new (keeps studio pre-filled).
  if (body.artistName) {
    const [existing] = await db
      .select({ id: creatorProfiles.id })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, user.id))
      .limit(1);
    if (!existing) {
      await db.insert(creatorProfiles).values({
        userId: user.id,
        artistName: body.artistName,
        genres: body.genres,
        influences: body.influences,
        targetAudience: body.targetAudience,
        goals: body.goals,
        bio: body.bio,
      });
    }
  }

  return ok({ plan: saved }, rid, 201);
});
