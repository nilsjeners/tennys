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

See [`CLAUDE.md`](CLAUDE.md) for full architecture, commands, and product decisions.
