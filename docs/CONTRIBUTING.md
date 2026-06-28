# Contributing — Market Standard SAAS

## Prerequisites

- Node.js 20+
- pnpm 9+
- Git
- (Optional) Stripe CLI for webhook forwarding
- (Optional) Slack app for Standard Polls local testing

## Getting started

```bash
git clone <repo>
cd SAAS
pnpm install
pnpm dev:local
```

`pnpm dev:local` starts PGlite + the gateway on port 4000 + all 11 apps on ports 3001–3011. Wait for each app's `/api/health` to return 200 before running specs.

## Repository conventions

### Monorepo layout

- `apps/*` — one Next.js 15 App Router app per product
- `packages/*` — shared libraries (`db`, `ui`, `auth`, `billing`)
- `e2e/*` — Playwright specs
- `scripts/*` — tooling (screenshots, env setup, schema push)
- `docs/*` — architecture + deployment + strategy docs

### Adding a new app

1. Copy the closest existing app (e.g. `apps/standard-regex` for a tool app, `apps/standard-status` for a monitoring app)
2. Update `package.json` name + port
3. Add the schema to `packages/db/src/schema/{name}.ts` + DDL to `packages/db/src/push-local-schema.ts`
4. Add the product to `packages/billing/src/plans.ts` `ProductId` union
5. Wire into `e2e/helpers.ts` `BASE` + `ROUTES`
6. Wire into `packages/ui/src/marketing/portfolio-urls.ts` + `suite-switcher.tsx`
7. Add `STRATEGY.md` + `README.md` (copy `apps/standard-polls/STRATEGY.md` format)
8. Add marketing page using `MarketingLanding` (auto-injects JSON-LD + FAQ + comparison)
9. Add dashboard pages using `DashboardShell` + `PageHeader` + `KpiCard`

### Design system

All UI uses `@market-standard/ui`. Do not write app-local CSS for components that belong in the design system. New components go in `packages/ui/src/dashboard/` or `packages/ui/src/marketing/` and are exported from `packages/ui/src/index.ts`.

### Data layer

- Schema in `packages/db/src/schema/{app}.ts` (Drizzle)
- Local DDL in `packages/db/src/push-local-schema.ts`
- App data helpers in `apps/{app}/src/lib/{app}-data.ts` — always branch on `isLocalGatewayMode()` (gateway fetch vs direct DB)

### Cross-sell wiring

When adding a cross-sell deep link:
1. Use a `source={app}` query param on the target URL
2. The target intake form reads the param and pre-fills (see `CreateIncidentForm` for the pattern)
3. Add the link to [CROSS_SELL_MAP.md](./CROSS_SELL_MAP.md)
4. Add a spec to `e2e/cross-sell.spec.ts`

### Server vs client components

Next.js 15 App Router: data-fetching pages are server components by default. Use `"use client"` only for interactivity (forms, state, event handlers). Do not pass functions from server components to client components — this serializes and fails. See the `DataTable` revert in Phase 2 for an example.

## Commit message convention

```
phase-{N}: {short summary}

{bullet points of what changed}
```

Examples: `phase-2: design system upgrades + dashboard polish`, `phase-3: wire 10 cross-sell deep links`.

## Pull request checklist

- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green
- [ ] `pnpm test:e2e:local` green (or note which specs fail + why)
- [ ] Screenshots captured for any UI change (`scripts/baseline-screens.ts`)
- [ ] `STRATEGY.md` + `README.md` updated for new apps
- [ ] Cross-sell map updated for new deep links
- [ ] No secrets committed (`.env*` is gitignored)

## Deployment

Production deploys require explicit user approval. See [DEPLOYMENT.md](./DEPLOYMENT.md). The CI pipeline (Phase 10) runs typecheck → lint → test → build on every PR; Vercel preview per PR.
