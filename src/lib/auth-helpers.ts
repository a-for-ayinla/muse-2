import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionUser, type AuthUser } from "@/lib/auth";

/** Route-handler identity: always derived server-side from the session cookie. */
export async function requireApiUser(rid?: string): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError("UNAUTHENTICATED", `Log in to continue.${rid ? " Ref: " + rid : ""}`, 401);
  }
  return user;
}

export async function findUserByEmail(email: string) {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
}

/** Login + recovery throttling, keyed per account+route to blunt brute force. */
export async function throttle(bucket: string, max = 10, windowSeconds = 300): Promise<void> {
  const rl = await rateLimit(bucket, max, windowSeconds);
  if (!rl.allowed) {
    throw new ApiError("RATE_LIMITED", "Too many attempts. Wait a few minutes and try again.", 429);
  }
}
