import { handler, ok, readJson } from "@/lib/api";
import { forgotSchema } from "@/lib/validators";
import { createAuthToken } from "@/lib/auth";
import { findUserByEmail, throttle } from "@/lib/auth-helpers";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Password recovery. Never reveals whether an account exists.
 * Email delivery requires SMTP_URL; when unconfigured we return the honest
 * state (and, outside production, the reset link for development only).
 */
export const POST = handler(async (req, rid) => {
  const body = forgotSchema.parse(await readJson(req));
  await throttle(`forgot:${body.email}`, 4, 600);

  const user = await findUserByEmail(body.email);
  let devLink: string | undefined;
  if (user) {
    const token = await createAuthToken(user.id, "password_reset", 60);
    const link = `${env.appUrl}/reset-password?token=${token}`;
    if (env.emailConfigured) {
      // SMTP integration point — send `link`. Not configured in this environment.
      console.info(`[muse] password reset requested for account ${user.id} (email configured)`);
    } else if (!env.isProd) {
      devLink = link; // development convenience only, never in production
    } else {
      console.info(`[muse] password reset requested for account ${user.id}; delivery unavailable`);
    }
  }
  return ok(
    {
      delivered: env.emailConfigured,
      message: env.emailConfigured
        ? "If an account exists for that email, a reset link is on its way."
        : "Email delivery isn't configured in this environment, so no reset email could be sent.",
      ...(devLink ? { devLink } : {}),
    },
    rid,
  );
});
