import { CatalogError, type CatalogQuery, type MusicProvider } from "../provider";

/**
 * The `none` provider: valid with zero credentials. Always returns a typed
 * catalog-unavailable error. Muse never invents songs to fill the gap.
 */
export const noneProvider: MusicProvider = {
  name: "none",
  attribution: "No music provider configured",
  isDemo: false,
  async search(_q: CatalogQuery) {
    throw new CatalogError(
      "UNAVAILABLE",
      "No music catalog is connected yet (MUSIC_PROVIDERS=none). Muse will not invent songs — configure a provider to get real results.",
    );
  },
  async similarArtists() {
    throw new CatalogError(
      "UNAVAILABLE",
      "No music catalog is connected yet (MUSIC_PROVIDERS=none).",
    );
  },
};
