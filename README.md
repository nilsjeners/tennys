# Tennys

pnpm + Turborepo monorepo:

- `apps/native/` — the Expo app (React Native), `@repo/native`
- `apps/web/` — internal admin dashboard (Next.js, Vercel), `@repo/web`
- `packages/backend/` — Convex backend (`convex/`), `@repo/backend`

## Get started

```bash
pnpm install
pnpm convex:dev       # terminal 1 — Convex backend
pnpm start            # terminal 2 — Expo dev server
```

Copy each `.env.example` to `.env.local` (`apps/native`, `apps/web`, `packages/backend`).

Checks: `pnpm typecheck`, `pnpm lint`, `pnpm turbo build --filter=@repo/web`.

## Deployment

- **Web (Vercel):** Root Directory `apps/web`. Build command and ignored build step come from `apps/web/vercel.json` (`convex deploy` from `packages/backend`, then `next build`; `turbo-ignore` skips builds without web changes). Needs `CONVEX_DEPLOY_KEY` (production key for Production, preview key for Preview).
- **Native (EAS):** builds via `eas build --profile development|preview|production` in `apps/native`. OTA via `eas update --channel <profile>`; `runtimeVersion` uses the `fingerprint` policy, so updates only reach builds with identical native code.

## Backward compatibility (old store versions keep talking to the backend)

Old app versions stay installed for months. Every backend change must keep them working.

- **Schema changes are additive.** New fields are `v.optional(...)`. Never rename or retype a field in place.
- **Removing a field:** stop writing it, migrate data with `@convex-dev/migrations` (`convex/migrations.ts`), drop it only after `MIN_APP_VERSION` is past every version that reads it.
- **Public functions are an API.** Don't rename them or change argument shapes incompatibly; add `fooV2` and keep `foo` until old versions are blocked.
- **Forcing an update:** `npx convex env set MIN_APP_VERSION <version>` (compared to `version` in `apps/native/app.json`). Below it, the app shows a blocking update screen.

See [`CLAUDE.md`](CLAUDE.md) for full architecture, commands, and product decisions.
