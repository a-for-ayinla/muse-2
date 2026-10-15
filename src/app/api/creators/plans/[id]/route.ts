import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { creatorPlans } from "@/db/schema";
import { ApiError, handler, ok, readJson } from "@/lib/api";
import { creatorPlanSchema } from "@/lib/ai/creator";
import { patchPlanSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function loadOwned(id: string, userId: string) {
  const [plan] = await db
    .select()
    .from(creatorPlans)
    .where(and(eq(creatorPlans.id, id), eq(creatorPlans.userId, userId)))
    .limit(1);
  if (!plan) throw new ApiError("NOT_FOUND", "Plan not found.", 404);
  return plan;
}

export const GET = handler(async (_req, rid, ctx) => {
  const user = await requireApiUser(rid);
  const { id } = await (ctx as Ctx).params;
  return ok({ plan: await loadOwned(id, user.id) }, rid);
});

export const PATCH = handler(async (req, rid, ctx) => {
  const user = await requireApiUser(rid);
  const { id } = await (ctx as Ctx).params;
  await loadOwned(id, user.id);
  const body = patchPlanSchema.parse(await readJson(req));
  let validatedPlan: unknown;
  if (body.plan !== undefined) {
    const parsed = creatorPlanSchema.safeParse(body.plan);
    if (!parsed.success) throw new ApiError("VALIDATION", "Plan content is not valid.", 422);
    validatedPlan = parsed.data;
  }
  const [updated] = await db
    .update(creatorPlans)
    .set({
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(validatedPlan !== undefined ? { plan: validatedPlan as object } : {}),
      updatedAt: new Date(),
    })
    .where(eq(creatorPlans.id, id))
    .returning();
  return ok({ plan: updated }, rid);
});

export const DELETE = handler(async (_req, rid, ctx) => {
  const user = await requireApiUser(rid);
  const { id } = await (ctx as Ctx).params;
  await loadOwned(id, user.id);
  await db.delete(creatorPlans).where(eq(creatorPlans.id, id));
  return ok({ deleted: true }, rid);
});
