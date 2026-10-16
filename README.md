# muse

**Your sound. Your culture. Your AI.**

Muse is a Nigerian AI music companion for listeners, independent artists, DJs and creators.
Conversational discovery grounded in a real catalog, saved playlists, recommendation
feedback, listening history, and a creator studio — with a loud, friendly Lagos
night-market look. It is a companion, **not** a streaming service: no audio playback,
tracks open on the platform you choose.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript strict
- Tailwind CSS v4 — locked brand design system (tokens live in `globals.css` + `src/config/brand.ts`)
- PostgreSQL via Drizzle ORM (`src/db/schema.ts`, pg driver)
- Cookie session auth (bcryptjs password hashes, DB sessions, sliding expiry) with a `proxy.ts` gate
- Zod on every request body and every structured AI output
- Provider-neutral music catalog (`src/lib/music/`) — `none` (default) and explicit `demo` flag
- AI orchestration (`src/lib/ai/`): Pidgin-aware deterministic intent extraction + grounded
  response generation; optional LLM refinement (`AI_PROVIDER=anthropic|openai`) with
  Zod validation, catalog-grounded filtering, bounded retry and safe fallback
- Postgres-backed rate limiting (`rate_limits` table) — not in-memory
- Vitest unit tests (`tests/`)

## Brand lock

The palette, logo mark/wordmark, Bagel Fat One + Fredoka fonts and chunky component style
are **locked**. Change tokens in `src/config/brand.ts` / `globals.css` only. The theme
toggle persists per device.

Dark theme is the default. Light theme reassigns the **same semantic tokens** — `bg`, `tx`,
`tx2`, `ph`, `surf`, `deep`, `raise`, `line`, `card-line`, `inner-line`, `field`,
`field-line`, `shadow`, `muted`, `dim`, `accent`, `accent-2`, `focus` — so every surface,
border and text role flips together: cream page, paper cards, warm wells, ink type and ink
shadows. The brand constants (`ink`, `cream`, `lime`, `pink`) never move, except where they
are used as *text* on a surface, which is what `--accent` / `--accent-2` are for (lime and
hibiscus deepened so they stay legible on cream).

Two rules keep that working:

- Components style themselves with token classes only — `bg-surf`, `bg-deep`, `bg-raise`,
  `bg-field`, `text-tx`, `text-tx2`, `text-accent`, `border-card-line`, `border-line`,
  `border-fieldline`. Never a hard-coded surface hex (`#2A2D23`, `#34372C`, `#4A4D40`, …).
- `text-cream` is reserved for text on a **fixed** ink surface (`bg-ink`, the dialog scrim).
  It is not the default body colour — `text-tx` is.

## Setup

1. `npm install` (Node 20+)
2. Copy `.env.example` → `.env` and fill values (see docs below each variable).
3. Provision Postgres and set `DATABASE_URL`.
4. Apply schema: `npx drizzle-kit push --config=drizzle.config.json`
5. `npm run dev` → http://localhost:3000

No separate seed step is required: with `MUSIC_PROVIDERS=demo`, the demo provider
idempotently seeds its clearly-fictional catalog into `music_tracks` on first search.

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | yes | Used for reset/confirmation links |
| `MUSIC_PROVIDERS` | yes | Canonical (plural). `none` = honest unavailable state (default upstream), `demo` = explicit fictional catalog with visible banner |
| `AI_PROVIDER` / `AI_API_KEY` / `AI_MODEL` | optional | `none` (default) uses the deterministic grounded pipeline. Keys stay server-side |
| `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS` | optional | Defaults 20 / 60 |
| `LOG_LEVEL` | optional | `info` default |
| `SMTP_URL` | optional | Email delivery. Unset ⇒ signup activates accounts immediately and password recovery reports the honest unconfigured state |
| `APPLE_MUSIC_*` | reserved | Apple adapter **not implemented** — requires approved credentials + terms review before build-out (never scraped, never faked) |

## Checks

- `npm run lint` — ESLint
- `npm exec tsc -- --noEmit` — type-check
- `npx vitest run` — unit tests (intent extraction incl. Pidgin prompts, grounding
  guarantees, ranking + feedback, URL safety, creator-plan validation)
- `npm run build` — production build

## Verification checklist (deployed or local)

1. Sign up → onboarding dialog → land on /listen. Log out, log back in with `?next=` redirect respected.
2. Ask: *"Give me smooth Nigerian songs for a night drive"* and *"Wetin dey sweet for Sunday?"*
   → grounded replies with track cards (demo banner visible when `demo`).
3. Like / not-for-me → affects later ranking. Save a track to a new playlist.
4. /playlists → rename, reorder (drag + arrow buttons), remove, visibility toggle, open external search link.
5. /history → open and delete a conversation; delete all.
6. /create → save artist profile, generate a plan (all labelled *Suggestion*), tick checklist items, rename, delete.
7. /settings → edit prefs, delete all conversations, delete account (password confirm).
8. Theme toggle → persists across reloads. Flip to light on `/`, `/login` and every page under
   `/listen`, `/create`, `/playlists`, `/history`, `/settings`: no dark panels survive, no text
   goes invisible, dialogs/cards/inputs all read as paper. `/dev/ui` shows every primitive in
   both themes (404 in production).
9. Mobile widths (360/390/768/1280) — no horizontal overflow; bottom tab bar with 44px targets.

## Honesty boundaries

- Recommendations come only from catalog retrieval; a model trying to recommend an
  unretrieved track is dropped (`filterGroundedTrackIds` — tested).
- `MUSIC_PROVIDERS=none` yields a typed, recoverable catalog-unavailable state; Muse never invents songs.
- Creator advice is labelled suggestion; no invented streams, charts or audience stats.
- Similar artists come only from catalog evidence.
