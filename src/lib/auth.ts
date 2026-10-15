import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, sessions, users } from "@/db/schema";

const COOKIE = "muse_session";
const SESSION_DAYS = 30;

export type AuthUser = typeof users.$inferSelect;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

/* ---------- sessions ---------- */

export async function createSession(userId: string, userAgent = ""): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({
    userId,
    tokenHash: sha256(token),
    userAgent: userAgent.slice(0, 300),
    expiresAt: expires,
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

/** Read-only session lookup — identity is always derived server-side from the DB. */
export async function getSessionUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (rows.length === 0) return null;
  // Sliding expiration (only when far from expiry to avoid a write per request).
  if (rows[0].session.expiresAt.getTime() - Date.now() < (SESSION_DAYS / 2) * 86_400_000) {
    try {
      await db
        .update(sessions)
        .set({ expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000) })
        .where(eq(sessions.id, rows[0].session.id));
    } catch {
      /* read-only contexts may not allow writes; ignore */
    }
  }
  return rows[0].user;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  }
  jar.delete(COOKIE);
}

/** Page guard: redirects to /login with a return path. */
export async function requireUser(next: string): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/* ---------- one-time tokens (password reset / email confirm) ---------- */

export async function createAuthToken(
  userId: string,
  kind: "password_reset" | "email_confirm",
  ttlMinutes = 60,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.insert(authTokens).values({
    userId,
    kind,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
  });
  return token;
}

export async function consumeAuthToken(
  token: string,
  kind: "password_reset" | "email_confirm",
): Promise<string | null> {
  const rows = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, sha256(token)),
        eq(authTokens.kind, kind),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (rows.length === 0) return null;
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, rows[0].id));
  return rows[0].userId;
}
