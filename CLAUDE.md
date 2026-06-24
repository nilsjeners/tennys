# CLAUDE.md

## Project: TENNYS

Social tennis match-tracking app (player/coach network, match logging, rankings, social feed). Mobile-first.

**Stack**
- Frontend: Expo / React Native
- Backend: Convex (typed schema, real-time queries, no SQL migrations, cheap to evolve)
- Design source: Claude Design screens, synced via `/design-sync`
- Auth: Convex + Better Auth (Expo-compatible)

**Data model**
Full sketch lives in [`docs/tennys-datenmodell-skizze.md`](docs/tennys-datenmodell-skizze.md). The Convex schema is derived from it in `convex/schema.ts`. Core entities: User, PlayerProfile, Club, Connection, Match, MatchResult, StrengthSnapshot, Post, Media, Comment, Reaction, Notification.

Key relationship: matches reference **PlayerProfile**, not User directly. PlayerProfile is the stable tennis identity, it can exist without an owning User (coach-created "private" profile) and later gets claimed (`ownerUserId` set) without losing its match history.

**Locked product decisions, do not re-litigate without asking**
- Matches are not editable after creation. Deletable only if they are the most recent match for *all* participants. Deleting a match must also delete its MatchResult and the participants' StrengthSnapshot rows for that match, then reset `currentStrength` on PlayerProfile to the prior snapshot's value, or 1000 if none exists.
- Reactions support multiple tennis-specific types, not just a generic like. One reaction row per `(matchId, userId)`, re-reacting changes the type rather than adding a row.
- Notifications are a stored entity with read status and history, not computed on the fly.
- Season (summer/winter) is a fixed global calendar rule, the same for every club. Don't add a separate `Season` table, compute and denormalize the season label onto `Match` instead.
- Media attaches only to `Post`, never to `Comment`.
- A PlayerProfile belongs to at most one Club for MVP. This is a deliberate simplification, not a forgotten feature, don't add multi-club support unless asked.

If an implementation detail isn't covered above and isn't obvious from the data model file, ask rather than guess, these are product decisions, not engineering ones.

---

## Behavioral Guidelines

Reduce common LLM coding mistakes. The rules above are project-specific and take precedence where they overlap with judgment calls below.

**Tradeoff:** these guidelines bias toward caution over speed. For trivial tasks, use judgment.

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
