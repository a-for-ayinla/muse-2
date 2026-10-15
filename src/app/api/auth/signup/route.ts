import { handler, ok, readJson } from "@/lib/api";
import { signupSchema } from "@/lib/validators";
import { createSession, hashPassword } from "@/lib/auth";
import { findUserByEmail, throttle } from "@/lib/auth-helpers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = handler(async (req, rid) => {
  const body = signupSchema.parse(await readJson(req));
  await throttle(`signup:${body.email}`, 6, 600);

  if (await findUserByEmail(body.email)) {
    throw new ApiError("CONFLICT", "An account with this email already exists. Try logging in.", 409);
  }
  const passwordHash = await hashPassword(body.password);
  const [user] = await db
    .insert(users)
    .values({
      email: body.email,
      passwordHash,
      displayName: body.displayName,
      // Email delivery is not configured in this environment; the account is
      // active immediately and the UI states this honestly.
      emailConfirmed: !env.emailConfigured,
    })
    .returning();
  await createSession(user.id, req.headers.get("user-agent") ?? "");
  return ok(
    {
      user: publicUser(user),
      notice: env.emailConfigured
        ? "Check your inbox to confirm your email address."
        : "Your account is active. Email delivery isn't configured in this environment, so no confirmation email was sent.",
    },
    rid,
    201,
  );
});

export function publicUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    preferredLanguage: u.preferredLanguage,
    genres: u.genres,
    moods: u.moods,
    preferredPlatform: u.preferredPlatform,
    onboardingCompleted: u.onboardingCompleted,
  };
}
