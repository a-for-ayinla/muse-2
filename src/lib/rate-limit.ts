import { sql } from "drizzle-orm";
import { db } from "@/db";
import { env } from "@/lib/env";

/**
 * Postgres-backed fixed-window rate limiter (works across instances,
 * unlike in-memory counters). Atomic upsert; failures fail closed-open:
 * if the limiter store is down we allow the request but log — the app
 * must stay available; abuse protection degrades, not the product.
 */
export async function rateLimit(
  key: string,
  max = env.rateLimitMax,
  windowSeconds = env.rateLimitWindow,
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const rows = await db.execute<{ allowed: boolean; remaining: number }>(sql`
      with w as (select to_timestamp(floor(extract(epoch from now()) / ${windowSeconds}) * ${windowSeconds}) as ws)
      insert into rate_limits (bucket, window_start, count)
      select ${key}, w.ws, 1 from w
      on conflict (bucket, window_start) do update set count = rate_limits.count + 1
      returning (count <= ${max}) as allowed, greatest(0, ${max} - count) as remaining
    `);
    const row = rows.rows?.[0];
    if (!row) return { allowed: true, remaining: 0 };
    return { allowed: row.allowed, remaining: row.remaining };
  } catch (e) {
    console.error("[muse] rate limiter store unavailable", e);
    return { allowed: true, remaining: 0 };
  }
}
