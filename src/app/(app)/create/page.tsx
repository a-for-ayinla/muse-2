import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { creatorPlans, creatorProfiles } from "@/db/schema";
import { providerStatus } from "@/lib/music";
import { requireUser } from "@/lib/auth";
import { CreateClient } from "@/components/app/create-client";

export const metadata: Metadata = { title: "Create" };

export default async function CreatePage() {
  const user = await requireUser("/create");
  const [profileRows, plans] = await Promise.all([
    db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id)).limit(1),
    db
      .select()
      .from(creatorPlans)
      .where(eq(creatorPlans.userId, user.id))
      .orderBy(desc(creatorPlans.updatedAt))
      .limit(30),
  ]);

  return (
    <CreateClient
      provider={providerStatus()}
      initialProfile={profileRows[0] ?? null}
      initialPlans={plans.map((p) => ({
        id: p.id,
        title: p.title,
        planType: p.planType,
        inputs: p.inputs as Record<string, unknown>,
        plan: p.plan as never,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))}
    />
  );
}
