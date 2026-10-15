import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  index,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* ---------- auth ---------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull().default(""),
    role: text("role").notNull().default("listener"), // listener | creator
    preferredLanguage: text("preferred_language").notNull().default("English"),
    genres: text("genres").array().notNull().default([]),
    moods: text("moods").array().notNull().default([]),
    preferredPlatform: text("preferred_platform").notNull().default("any"),
    onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
    emailConfirmed: boolean("email_confirmed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_key").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent").notNull().default(""),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sessions_token_key").on(t.tokenHash), index("sessions_user_idx").on(t.userId)],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    kind: text("kind").notNull(), // password_reset | email_confirm
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("auth_tokens_user_idx").on(t.userId), index("auth_tokens_hash_idx").on(t.tokenHash)],
);

/* ---------- catalog (server-managed only) ---------- */

export const musicTracks = pgTable(
  "music_tracks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    providerTrackId: text("provider_track_id").notNull(),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    album: text("album").notNull().default(""),
    artworkUrl: text("artwork_url"),
    externalUrl: text("external_url"),
    previewUrl: text("preview_url"),
    releaseDate: date("release_date"),
    genres: text("genres").array().notNull().default([]),
    languages: text("languages").array().notNull().default([]),
    moods: text("moods").array().notNull().default([]),
    occasions: text("occasions").array().notNull().default([]),
    metadataSource: text("metadata_source").notNull().default(""),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("music_tracks_provider_key").on(t.provider, t.providerTrackId),
    index("music_tracks_genres_idx").on(t.genres),
  ],
);

/* ---------- chat ---------- */

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New conversation"),
    mode: text("mode").notNull().default("listen"), // listen | create
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chat_sessions_user_idx").on(t.userId, t.updatedAt)],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // user | assistant
    content: text("content").notNull(),
    intent: jsonb("intent"),
    tracks: jsonb("tracks"), // denormalised snapshot of returned track ids for grounding audit
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chat_messages_session_idx").on(t.sessionId, t.createdAt)],
);

/* ---------- playlists ---------- */

export const playlists = pgTable(
  "playlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    visibility: text("visibility").notNull().default("private"), // private | public
    source: text("source").notNull().default("manual"), // manual | chat
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("playlists_user_idx").on(t.userId, t.updatedAt)],
);

export const playlistTracks = pgTable(
  "playlist_tracks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    trackId: uuid("track_id")
      .notNull()
      .references(() => musicTracks.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("playlist_tracks_unique").on(t.playlistId, t.trackId),
    index("playlist_tracks_order_idx").on(t.playlistId, t.position),
  ],
);

/* ---------- feedback ---------- */

export const userFeedback = pgTable(
  "user_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trackId: uuid("track_id")
      .notNull()
      .references(() => musicTracks.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => chatSessions.id, { onDelete: "set null" }),
    kind: text("kind").notNull(), // like | not_for_me
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("user_feedback_user_track").on(t.userId, t.trackId),
    index("user_feedback_user_idx").on(t.userId),
  ],
);

/* ---------- creator ---------- */

export const creatorProfiles = pgTable(
  "creator_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    artistName: text("artist_name").notNull().default(""),
    bio: text("bio").notNull().default(""),
    genres: text("genres").array().notNull().default([]),
    influences: text("influences").array().notNull().default([]),
    targetAudience: text("target_audience").notNull().default(""),
    goals: text("goals").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("creator_profiles_user_key").on(t.userId)],
);

export const creatorPlans = pgTable(
  "creator_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    planType: text("plan_type").notNull(), // positioning | release | content | promo | full
    inputs: jsonb("inputs").notNull(),
    plan: jsonb("plan").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("creator_plans_user_idx").on(t.userId, t.updatedAt)],
);

/* ---------- rate limiting (distributed: backed by Postgres) ---------- */

export const rateLimits = pgTable(
  "rate_limits",
  {
    bucket: text("bucket").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.bucket, t.windowStart] })],
);
