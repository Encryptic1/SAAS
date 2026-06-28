# Architecture — Market Standard SAAS Portfolio

## Overview

Market Standard is a portfolio of 11+ focused SaaS apps that share a backend but deploy independently. Each app solves one job extremely well and cross-sells the rest of the suite via deep links + a universal suite switcher.

## Repository layout

```
f:\dev\SAAS
├── apps/                      # Next.js 15 App Router apps (one per product)
│   ├── standard-polls/        # port 3001
│   ├── standard-proof/        # port 3002
│   ├── standard-metrics/      # port 3003
│   ├── standard-hook/         # port 3004
│   ├── standard-release/      # port 3005
│   ├── standard-vault/        # port 3006
│   ├── standard-links/        # port 3007
│   ├── standard-snippets/     # port 3008
│   ├── standard-status/       # port 3009
│   ├── standard-regex/        # port 3010
│   ├── standard-postmortem/   # port 3011
│   ├── standard-lens/         # port 3012 (Phase 6)
│   ├── standard-cron/         # port 3013 (Phase 6)
│   └── standard-workspace/    # port 3014 (Phase 11)
├── packages/
│   ├── db/                    # Drizzle ORM schema + PGlite/Supabase client
│   ├── ui/                    # Shared design system (dashboard + marketing)
│   ├── auth/                  # Supabase auth helpers
│   └── billing/               # Stripe plans + checkout helpers
├── e2e/                       # Playwright specs (21+ per-app + cross-sell + mobile)
├── scripts/                   # baseline-screens, setup-vercel-envs, push-local-schema
└── docs/                      # this folder
```

## Shared infrastructure

| Resource | Provider | Notes |
|----------|----------|-------|
| Postgres + Auth | Supabase (`opodtvblrelmpoaprmpr`) | One project, pg-schemas per app (`polls`, `metrics`, `hook`, …) + `shared` schema |
| Payments | Stripe | One account, one product per app, webhook per app |
| Hosting | Vercel | One project per app, env vars per project |
| Local dev DB | PGlite (browser/Node) | `pnpm dev:local` — no Supabase needed |

## Data layer

Each app owns a Postgres schema (e.g. `hook.webhook_events`, `postmortem.incidents`). Cross-app data lives in the `shared` schema (`billing_customers`, `pulse_events`, `digest_configs`, `agent_reports`, `snippets`). The Drizzle schema is in `packages/db/src/schema/`; the local-dev DDL is in `packages/db/src/push-local-schema.ts`.

### Local vs remote

- **Local gateway mode** (`NEXT_PUBLIC_LOCAL_GATEWAY=true`): apps talk to a gateway service on port 4000 which wraps PGlite. Schema is pushed via `pushLocalSchema()`.
- **Remote mode** (production): apps connect to Supabase directly via `getDbAsync()`. Migrations are applied via the Supabase MCP.

## Auth

Supabase email magic-link auth. Each app has `src/middleware.ts` guarding `/dashboard/*`. The same Supabase user works across all apps (SSO via `shared.sso_codes` for Enterprise tier).

## Design system

`packages/ui` exports:
- **Marketing:** `MarketingLanding` (auto-injects JSON-LD + FAQ + comparison table), `SuiteSwitcher`, `PrivacyPage`
- **Dashboard:** `DashboardShell` (sidebar + top bar + command palette + toast provider), `PageHeader`, `KpiCard` (with sparkline), `Badge`, `Skeleton`, `Toast`, `DataTable`, `EmptyState`, `CommandPalette` (⌘K)

## Cross-sell topology

See [CROSS_SELL_MAP.md](./CROSS_SELL_MAP.md) for the full deep-link map. Every app renders a `SuiteSwitcher` in the dashboard shell and a `PoweredByBadge` on free-tier artifacts.

## Billing

`packages/billing/src/plans.ts` defines the `ProductId` union + `PLANS` map. Each app has `/api/billing/checkout` + `/api/billing/portal` + `/api/webhooks/stripe`. Free tier requires a powered-by badge; paid tiers remove it.

## Testing

- **Typecheck:** `pnpm typecheck` (tsc --noEmit per package)
- **Lint:** `pnpm lint` (tsc --noEmit per app — Biome not yet wired)
- **E2E:** `pnpm test:e2e:local` (Playwright against `pnpm dev:local`)
- **Screenshots:** `pnpm exec tsx scripts/baseline-screens.ts` (Playwright, desktop + mobile)

See [TESTING.md](./TESTING.md) for the full strategy.
