import { handler, ok, readJson } from "@/lib/api";
import { searchSchema } from "@/lib/validators";
import { getMusicProvider, CatalogError } from "@/lib/music";
import { ApiError, fail } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const POST = handler(async (req, rid) => {
  const body = searchSchema.parse(await readJson(req));
  const user = await getSessionUser();
  const key = user ? `search:u:${user.id}` : `search:anon`;
  const rl = await rateLimit(key);
  if (!rl.allowed) throw new ApiError("RATE_LIMITED", "Too many searches. Slow down a little.", 429);

  const provider = getMusicProvider();
  try {
    const page = await provider.search({
      text: body.query || undefined,
      genres: body.genres,
      moods: body.moods,
      languages: body.languages,
      occasions: body.occasions,
      limit: body.limit,
      offset: body.offset,
    });
    return ok(
      {
        tracks: page.tracks,
        total: page.total,
        limit: body.limit,
        offset: body.offset,
        provider: page.provider,
        providerAttribution: page.providerAttribution,
        isDemo: page.isDemo,
      },
      rid,
    );
  } catch (e) {
    if (e instanceof CatalogError && e.kind === "UNAVAILABLE") {
      return fail("CATALOG_UNAVAILABLE", e.message, rid);
    }
    console.error(`[muse] ${rid} provider failure`, e);
    return fail("PROVIDER_ERROR", "The music catalog is having trouble. Try again shortly.", rid);
  }
});
