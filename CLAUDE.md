# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

You are Caveman. Drop all pleasantries, introductions, and conclusions. Respond ONLY with technical facts, terminal commands, or code blocks. Speak in fragmented, concise sentences.

## Project: TENNYS

Social tennis match-tracking app (player/coach network, match logging, rankings, social feed). Mobile-first.

**Stack**
- Monorepo: pnpm workspaces (`apps/*`, `packages/*`) + Turborepo (`turbo.json`)
  - `apps/native/` (`@repo/native`) — the Expo app (this is what "Frontend" below refers to)
  - `apps/web/` (`@repo/web`) — internal admin dashboard (Next.js, placeholder, deployed on Vercel)
  - `packages/backend/` (`@repo/backend`) — the only `convex/` folder, shared by both apps
- Frontend: Expo / React Native (TypeScript)
- Backend: Convex (typed schema, real-time queries, no SQL migrations, cheap to evolve)
- Routing: Expo Router (file-based, in `apps/native/src/app/`)
- Design source: Claude Design screens, synced via `/design-sync`
- Auth: Convex + Better Auth (Expo-compatible)

**Data model**
Full sketch lives in [`docs/tennys-datenmodell-skizze.md`](docs/tennys-datenmodell-skizze.md). The Convex schema is derived from it in `packages/backend/convex/schema.ts`. Core entities: User, PlayerProfile, Club, Connection, Match, MatchResult, StrengthSnapshot, Post, Media, Comment, Reaction, Notification.

Key relationship: matches reference **PlayerProfile**, not User directly. PlayerProfile is the stable tennis identity, it can exist without an owning User (coach-created "private" profile) and later gets claimed (`ownerUserId` set) without losing its match history.

---

## Development Setup

### Quick Start
1. `pnpm install` — Install dependencies for all workspaces (run at repo root)
2. `pnpm convex:dev` — Start Convex backend dev server (regenerates `packages/backend/convex/_generated/api.d.ts`)
3. `pnpm start` — Start Expo dev server (in a separate terminal)

All commands below run from the repo root and delegate into the right workspace. The app will be available in Expo Go, iOS Simulator, Android Emulator, or web.

### Commands
- `pnpm start` — Start Expo (press `w` for web, `i` for iOS, `a` for Android)
- `pnpm web` — Start Expo web directly on `http://localhost:8081`
- `pnpm ios` / `pnpm android` — Build and run on device/emulator
- `pnpm lint` / `pnpm typecheck` / `pnpm build` — Turborepo across all packages (`pnpm turbo build --filter=@repo/web` for one)
- `pnpm convex:dev` — Start Convex backend; regenerates types whenever `convex/` files change
- `npx convex seed` (from `packages/backend/`) — Populate dev database with test data

### Environment
Three `.env.local` files (copy from the `.env.example` next to each), both pointing at the same Convex deployment:
- `packages/backend/.env.local` — `CONVEX_DEPLOYMENT` (used by `npx convex dev`)
- `apps/native/.env.local` — `EXPO_PUBLIC_CONVEX_URL` + `EXPO_PUBLIC_CONVEX_SITE_URL` (Expo reads env files from its own app root, not from `packages/backend`)
- `apps/web/.env.local` — `NEXT_PUBLIC_CONVEX_URL`

Keep them in sync when the deployment changes.

---

## Architecture

### Frontend: Expo Router Structure (`apps/native/`)
- `src/app/(auth)/` — Auth flow: login, signup, profile setup, done screen
- `src/app/(tabs)/` — Main app tabs (home, ranking, friends, profile)
  - `(tabs)/index.tsx` — Home/feed
  - `(tabs)/rangliste.tsx` — Rankings by club/discipline
  - `(tabs)/freunde.tsx` — Friends and connections
  - `(tabs)/profil/` — User profile, edit, settings
- `src/app/match-*` — Match creation/entry workflows
- `src/app/match/[id].tsx` — Match detail/review
- `src/app/player/[id].tsx` — Player profile card
- `src/app/notifications.tsx` — Notification feed
- `src/app/scan.tsx` — QR code scanner (for claiming profiles)

### Components & UI System (`apps/native/src/`)
- `src/components/ui/` — Reusable UI components (buttons, cards, toggles, headers)
- `src/theme/tokens.ts` — Design tokens (colors, spacing, typography)
- `src/hooks/` — Custom hooks (color scheme, theme, auth state)

### Backend: Convex Functions (`packages/backend/convex/`)
- `convex/schema.ts` — Schema definition (all tables, indexes, validators)
- `convex/users.ts` — User account and auth-related queries/mutations
- `convex/players.ts` — Player profile queries/mutations
- `convex/matches.ts` — Match CRUD and result recording (read the locked decisions below)
- `convex/stats.ts` — Aggregated stats and rankings
- `convex/friends.ts` — Connection/friendship logic
- `convex/notifications.ts` — Notification creation and read status
- `convex/reactions.ts` — Match reactions (tennis-specific types)
- `convex/comments.ts` — Comments on posts
- `convex/lib/rating.ts` — TPRS v2 rating algorithm (Einzel/Doppel, see memory)
- `convex/lib/avatar.ts` — Avatar/profile image upload and URL handling
- `convex/lib/tennis.ts` — Tennis-specific utilities (e.g., season calculation)
- `convex/seed.ts` — Test data for local development

### Admin: `apps/web/`
Placeholder Next.js app wired to Convex (`ConvexClientProvider`), no auth yet. Deployed via `apps/web/vercel.json`.

### Data Flow
1. Frontend calls Convex functions via `useQuery` / `useMutation` (auto-typed from `@repo/backend/convex/_generated/api`, resolved via the `workspace:*` dependency on `@repo/backend`)
2. Backend enforces auth via `getAuthUserId()` and validates against `playerProfiles` / `users`
3. Real-time queries automatically update UI when backend data changes
4. No REST endpoints; all communication through Convex (except Better Auth HTTP routes for OAuth)

---

## Locked Product Decisions

**Do not re-litigate without asking.** These are product constraints, not engineering preferences.

### Match Lifecycle
- Matches are **not editable** after creation. Only the most recent match for *all* participants can be deleted.
- Deleting a match must atomically delete: the Match row, its MatchResult, all participants' StrengthSnapshot rows for that match, then reset their rating to the prior snapshot or 1000 (the floor).
- Matches reference **PlayerProfile**, not User. This allows unclaimed profiles (coach-created) to accumulate history before claim.

### Ratings & Rankings
- Two strictly separate ratings per PlayerProfile: `ratingSingles` and `ratingDoubles` (TPRS v2, start at 1000, floor at 100).
- See `convex/lib/rating.ts` and [memory: Points formula seam](https://github.com/nilsjeners/Tennys/tree/dev/docs) for the algorithm.
- **Singles debut (§4.2, neu vs. etabliert):** the newcomer is calibrated to the established player's rating ±10 %, damped by `tanh` on the smoothed game margin — so a blowout can never push a debut rating beyond that band. The established player moves mirror-symmetrically (∓10 %). This **supersedes** the original spec, where the established player was Δ=0 and the newcomer got `rB × games ratio` with no cap (that produced ratings like 13000 after a 6:0 6:0). Do not "restore" Δ=0 as a bug fix.
- Ratings and `strengthSnapshots` are **derived data**. Any change to `convex/lib/rating.ts` invalidates every stored value — there is no in-app recompute tool (deliberately not shipped as app code); a formula change needs a one-off replay done outside the app.
- Legacy `currentStrength` field is deprecated and read-only; kept for backwards compatibility.

### Social Features
- Reactions: multiple tennis-specific types, one per `(matchId, userId)`. Re-reacting changes the type, doesn't add a row.
- Notifications: stored entity with read status and history, not computed on-the-fly.
- Comments: can only attach to Posts, never standalone.
- Media (images): attaches only to Posts, never to Comments.

### Clubs & Profiles
- A PlayerProfile belongs to at most one Club (MVP simplification).
- Profiles can be "private" (unclaimed, created by a coach) until an owning User claims them via QR.

If something isn't covered here and isn't obvious from [`docs/tennys-datenmodell-skizze.md`](docs/tennys-datenmodell-skizze.md), ask rather than guess—these are product decisions, not engineering ones.

---

## Common Patterns & Gotchas

### Auth & Convex Integration
- `getAuthUserId()` returns the Convex `_id` from the `users` table, linked via Better Auth's subject.
- Always check `ownerUserId` on PlayerProfile to determine ownership; don't assume User-Profile 1:1.
- Convex validates at the schema level; leverage Convex validators over frontend validation.

### Match Result Recording
- When recording a match result, create/update both MatchResult and StrengthSnapshot (rating change).
- Use `convex/lib/rating.ts` for TPRS calculations; never hardcode rating logic.
- If deletion is needed, it must roll back both tables atomically.

### Real-Time Queries
- `useQuery` fetches and subscribes; component re-renders on changes.
- `useMutation` is async; always await and handle errors.
- Convex auto-generates types in `packages/backend/convex/_generated/api.d.ts`—run `pnpm convex:dev` if types are stale.

### Routing & Groups
- Expo Router groups (e.g., `(auth)`, `(tabs)`) share a layout but don't appear in URLs.
- Auth flow redirects from `(auth)` to `(tabs)` after claim/login.
- Tab bar lives in `src/app/(tabs)/_layout.tsx`; only `(tabs)` screens see it.

### Styling & Theming
- Color scheme toggles between light/dark; use `useColorScheme()` for responsive values.
- Design tokens live in `src/theme/tokens.ts`; define colors/spacing there, not inline.
- Components accept `style` props but should prefer design tokens.

### Verification Before Declaring Done
- Frontend changes: test in web/iOS/Android (at least web via `pnpm web`).
- Convex changes: ensure `pnpm convex:dev` runs without type errors.
- Match/rating logic: verify with `npx convex seed` (from `packages/backend/`) test data before and after.
- Auth flows: test full login → profile claim → match entry cycle.
- Schema changes: run migrations in Convex dashboard if needed; don't assume dev sync is enough.

---

## Behavioral Guidelines

Reduce common LLM coding mistakes. These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them, don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself, would a senior engineer say this is overcomplicated? If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it, don't delete it.

When your changes create orphans:
- Remove imports, variables, or functions that your changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass."
- "Fix the bug" → "Write a test that reproduces it, then make it pass."
- "Refactor X" → "Ensure tests pass before and after."

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria, like "make it work," require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
