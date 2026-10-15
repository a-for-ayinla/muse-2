import { z } from "zod";
import { brand } from "@/config/brand";

const genreEnum = z.enum(brand.genres);
const moodEnum = z.enum(brand.moods);
const langEnum = z.enum(brand.languages);
const platformEnum = z.enum(brand.platforms.map((p) => p.id) as [string, ...string[]]);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(100, "Password is too long.");

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: passwordSchema,
  displayName: z.string().trim().min(1, "Tell us what to call you.").max(60),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

export const resetSchema = z.object({
  token: z.string().min(10).max(200),
  password: passwordSchema,
});

export const searchSchema = z.object({
  query: z.string().trim().max(160).default(""),
  genres: z.array(genreEnum).max(6).default([]),
  moods: z.array(moodEnum).max(5).default([]),
  languages: z.array(langEnum).max(4).default([]),
  occasions: z.array(z.string().max(30)).max(4).default([]),
  limit: z.number().int().min(1).max(25).default(12),
  offset: z.number().int().min(0).max(500).default(0),
  storefront: z.string().trim().max(8).optional(), // reserved for Apple Music
});

export const chatRequestSchema = z.object({
  mode: z.enum(["listen", "create"]),
  message: z.string().trim().min(1, "Say something first.").max(500),
  sessionId: z.string().uuid().optional(),
});

export const createPlaylistSchema = z.object({
  title: z.string().trim().min(1, "Give the playlist a name.").max(80),
  description: z.string().trim().max(300).default(""),
  trackIds: z.array(z.string().uuid()).max(100).default([]),
});

export const patchPlaylistSchema = z
  .object({
    title: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(300).optional(),
    visibility: z.enum(["private", "public"]).optional(),
    addTrackIds: z.array(z.string().uuid()).max(50).optional(),
    removeTrackIds: z.array(z.string().uuid()).max(50).optional(),
    /** Full ordered list of track ids — used for reorder (keyboard + drag). */
    order: z.array(z.string().uuid()).max(100).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Nothing to update.",
  });

export const feedbackSchema = z.object({
  trackId: z.string().uuid(),
  kind: z.enum(["like", "not_for_me"]),
  sessionId: z.string().uuid().optional(),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  role: z.enum(["listener", "creator"]).optional(),
  preferredLanguage: langEnum.optional(),
  genres: z.array(genreEnum).max(10).optional(),
  moods: z.array(moodEnum).max(10).optional(),
  preferredPlatform: platformEnum.optional(),
  onboardingCompleted: z.boolean().optional(),
});

export const creatorProfileSchema = z.object({
  artistName: z.string().trim().max(80).default(""),
  bio: z.string().trim().max(1000).default(""),
  genres: z.array(genreEnum).max(6).default([]),
  influences: z.array(z.string().trim().max(60)).max(8).default([]),
  targetAudience: z.string().trim().max(300).default(""),
  goals: z.string().trim().max(500).default(""),
});

export const patchPlanSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
    plan: z.unknown().optional(), // re-validated against creatorPlanSchema in route
  })
  .refine((v) => v.title !== undefined || v.plan !== undefined, {
    message: "Nothing to update.",
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password to confirm."),
});
