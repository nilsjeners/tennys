# Tennys

npm workspace monorepo:

- `apps/app/` — the Expo app (React Native)
- `apps/admin/` — internal admin dashboard (Next.js, placeholder)
- `packages/backend/` — Convex backend (`convex/`)

## Get started

```bash
npm install
npm run convex:dev   # terminal 1 — Convex backend
npm start             # terminal 2 — Expo dev server
```

See [`CLAUDE.md`](CLAUDE.md) for full architecture, commands, and product decisions.
