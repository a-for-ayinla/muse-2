import { env } from "@/lib/env";
import { noneProvider } from "./providers/none";
import { demoProvider } from "./providers/demo";
import type { MusicProvider } from "./provider";

export type { NormalizedTrack, CatalogPage, CatalogQuery, MusicProvider } from "./provider";
export { CatalogError } from "./provider";

/**
 * Provider selection. Canonical env var: MUSIC_PROVIDERS (plural).
 * - "none" (default): valid, credential-free, typed unavailable errors.
 * - "demo": explicit flag; fictional catalog with a visible banner.
 * - "apple": reserved — requires approved Apple Music credentials and
 *   terms approval before implementation (never scraped, never faked).
 */
export function getMusicProvider(): MusicProvider {
  const p = env.musicProviders[0] ?? "none";
  if (p === "demo") return demoProvider;
  if (p === "apple") {
    console.warn("[muse] MUSIC_PROVIDERS=apple is not implemented yet; falling back to none.");
    return noneProvider;
  }
  return noneProvider;
}

export function providerStatus() {
  const provider = getMusicProvider();
  return {
    name: provider.name,
    isDemo: provider.isDemo,
    attribution: provider.attribution,
    configured: provider.name !== "none",
  };
}
