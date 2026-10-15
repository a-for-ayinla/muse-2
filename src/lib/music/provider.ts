/**
 * Provider-neutral music catalog interface.
 * Implementations: "none" (honest unavailable state), "demo" (explicitly
 * flagged fictional catalog), future: "apple" (storefront API — requires
 * approved credentials before implementation).
 */

export type NormalizedTrack = {
  id: string; // internal catalog id (uuid)
  provider: string;
  providerTrackId: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string | null;
  externalUrl: string | null; // verified listening URL; null when not permitted/available
  previewUrl: string | null;
  releaseDate: string | null;
  genres: string[];
  languages: string[];
  moods: string[];
  occasions: string[];
};

export type CatalogQuery = {
  text?: string;
  genres?: string[];
  moods?: string[];
  languages?: string[];
  occasions?: string[];
  artistRefs?: string[];
  excludedArtists?: string[];
  familiarity?: "familiar" | "discovery" | null;
  limit: number;
  offset?: number;
};

export type CatalogPage = {
  tracks: NormalizedTrack[];
  total: number;
  provider: string;
  providerAttribution: string;
  /** True only for the explicitly flagged demo provider. */
  isDemo: boolean;
};

export type CatalogErrorKind = "UNAVAILABLE" | "UPSTREAM" | "INVALID";

export class CatalogError extends Error {
  constructor(
    public kind: CatalogErrorKind,
    message: string,
  ) {
    super(message);
  }
}

export interface MusicProvider {
  name: string;
  attribution: string;
  isDemo: boolean;
  search(q: CatalogQuery): Promise<CatalogPage>;
  /** Catalog evidence for creator mode: artists matching genres (never invented). */
  similarArtists(genres: string[], exclude: string[], limit: number): Promise<string[]>;
}
