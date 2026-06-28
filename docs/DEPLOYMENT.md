# Deployment Setup — Market Standard, LLC

## Prerequisites
- Node.js 20+
- pnpm 9+
- Vercel account (team: `marketstandard`)
- Supabase project (shared: `opodtvblrelmpoaprmpr`)
- Stripe account (shared, live mode)
- Slack app (for Standard Polls)

## Architecture

All 11 Market Standard apps share **one Supabase project** (`opodtvblrelmpoaprmpr`) and **one Stripe account**, but deploy as **individual Vercel projects** with their own domains + env vars. Local dev uses PGlite via `pnpm dev:local` (no Supabase needed).

| App | Port | Domain | Stripe product |
|-----|------|--------|----------------|
| standard-polls | 3001 | polls.marketstandard.io | standard-polls |
| standard-proof | 3002 | proof.marketstandard.io | standard-proof |
| standard-metrics | 3003 | metrics.marketstandard.io | standard-metrics |
| standard-hook | 3004 | hook.marketstandard.io | standard-hook |
| standard-release | 3005 | release.marketstandard.io | standard-release |
| standard-vault | 3006 | vault.marketstandard.io | standard-vault |
| standard-links | 3007 | links.marketstandard.io | standard-links |
| standard-snippets | 3008 | snippets.marketstandard.io | standard-snippets |
| standard-status | 3009 | status.marketstandard.io | standard-status |
| standard-regex | 3010 | regex.marketstandard.io | standard-regex |
| standard-postmortem | 3011 | postmortem.marketstandard.io | standard-postmortem |

> **Stub apps** (standard-lens, standard-cron) have Stripe products + prices but no app code yet.

## 1. Clone & Install

```bash
pnpm install
```

## 2. Supabase Setup (shared project)

The shared Supabase project `opodtvblrelmpoaprmpr` already has all schemas + RLS applied via the Supabase MCP migrations:

- `polls.*`, `proof.*`, `metrics.*`, `shared.*`, `hook.*`, `release.*`, `standup.*`
- `msvault.*` (encrypted secrets — named `msvault` to avoid colliding with Supabase's built-in `vault` extension)
- `status.*`, `regex.*`, `postmortem.*` (with `pgvector` for recurrence detection)

To point an app at the shared Supabase project, set:
```
NEXT_PUBLIC_SUPABASE_URL=https://opodtvblrelmpoaprmpr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

### Storage bucket (Standard Proof)
A `proof-media` public bucket + RLS policy are already created via the portfolio migration.

## 3. Stripe Setup (shared account)

### Products & prices
All 13 products + 16 prices are created in the shared Stripe account (live mode) with `metadata.product` + `metadata.plan_id`. See the root [`.env.example`](../.env.example) for the full list of `STRIPE_PRICE_*` IDs.

| Product | Free | Starter | Growth |
|---------|------|---------|--------|
| standard-polls | $0 | $19/mo | $49/mo |
| standard-proof | $0 | $19/mo | $49/mo |
| standard-metrics | $0 | $29/mo | $79/mo |
| standard-hook | $0 | $9/mo | — |
| standard-release | $0 | $15/mo | — |
| standard-links | $0 | $19/mo | — |
| standard-vault | $0 | $19/mo | — |
| standard-snippets | $0 | $9/mo | — |
| standard-status | $0 | $19/mo | — |
| standard-regex | $0 | $9/mo | — |
| standard-postmortem | $0 | $19/mo | — |
| standard-lens (stub) | $0 | $29/mo | — |
| standard-cron (stub) | $0 | $15/mo | — |

### Webhooks
Create one webhook endpoint per Vercel project:
- URL: `https://<app-domain>/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Stripe Connect (Standard Metrics only)
1. Enable Connect in Stripe Dashboard
2. Create OAuth settings with redirect URI: `https://metrics.marketstandard.io/api/stripe/callback`
3. Copy Connect client ID to `STRIPE_CONNECT_CLIENT_ID`

> **Note**: Connect-enabled accounts cannot publish Stripe Apps. Use a separate Stripe account for future Marketplace listing.

## 4. Slack App Setup (Standard Polls)

1. Create app at https://api.slack.com/apps
2. Enable OAuth with redirect URL: `https://polls.marketstandard.io/api/slack/oauth/callback`
3. Add bot scopes: `commands`, `chat:write`, `chat:write.public`, `channels:read`, `users:read`
4. Create slash command `/poll` pointing to your events URL
5. Enable Event Subscriptions → Request URL: `https://polls.marketstandard.io/api/slack/events`
6. Copy Client ID, Client Secret, Signing Secret, Bot Token

## 5. Vercel Projects (one per app)

Create **11 separate Vercel projects** from the same Git repo, each with:

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Root Directory | `apps/<app-name>` |
| Build Command | `pnpm build` (auto-detected) |
| Fluid Compute | **Enabled** (required for Slack 3s ack on standard-polls) |
| Team | `marketstandard` |

### Vercel env var setup (automated)

Use the setup script to link each project + push all env vars via the Vercel CLI:

```bash
# 1. Authenticate the Vercel CLI (one time)
vercel login

# 2. Export the shared secrets (fill in real values)
$env:STRIPE_SECRET_KEY = "sk_live_..."
$env:STRIPE_WEBHOOK_SECRET = "whsec_..."  # per-app webhook secret
$env:NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_live_..."
$env:NEXT_PUBLIC_SUPABASE_URL = "https://opodtvblrelmpoaprmpr.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ..."
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJ..."

# 3. Run the setup script (creates env vars on each linked Vercel project)
pnpm vercel:setup-envs
```

The script reads each app's `.env.example`, resolves `STRIPE_PRICE_*` to the real price IDs, and pushes all vars to the linked Vercel project's `production` + `preview` + `development` environments.

> **Note**: You must `vercel link` each app first (`cd apps/<app> && vercel link --yes --project <name> --scope marketstandard`). The script will warn about any unlinked apps.

### Domains
Configure custom domains in each Vercel project's settings (see the table in the Architecture section).

## 6. Local Development

```bash
# All 11 apps + db-gateway (via Turborepo, uses local PGlite)
pnpm dev:local

# Or sync .env.local files from .env.example first:
pnpm db:setup   # writes .env.local for all apps + seeds local PGlite
```

| App | Local URL |
|-----|-----------|
| standard-polls | http://localhost:3001 |
| standard-proof | http://localhost:3002 |
| standard-metrics | http://localhost:3003 |
| standard-hook | http://localhost:3004 |
| standard-release | http://localhost:3005 |
| standard-vault | http://localhost:3006 |
| standard-links | http://localhost:3007 |
| standard-snippets | http://localhost:3008 |
| standard-status | http://localhost:3009 |
| standard-regex | http://localhost:3010 |
| standard-postmortem | http://localhost:3011 |

Local dev uses PGlite (a local Postgres in-process) via the db-gateway on port 4000. No Supabase connection needed for local dev.

## 7. Build Verification

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test:e2e   # Playwright E2E across all 11 apps
```

## 8. Observability (optional)

- **Sentry**: add `SENTRY_DSN` to each app's env vars
- **Vercel Analytics**: enable in project settings
- **First-party KPIs**: events logged to `shared.kpi_events` in Supabase
- **Suite Pulse**: agent reports + AI cost tracking in `shared.agent_reports` / `shared.agent_costs`

## 9. FloodG8 Suite Integration

The FloodG8 portfolio hub (Vercel project `floodg8`) bundles all 11 Market Standard apps via Stripe metadata:

- **TEAM_BUNDLE** + **ENTERPRISE_BUNDLE** in `floodg8/packages/shared/src/entitlements.ts` include `standard-*-starter` for all 11 apps.
- `PORTFOLIO_BUNDLE_MAP` in `floodg8/packages/billing/src/bundle-grant.ts` maps each bundle entitlement to its product + plan.
- SSO codes in `shared.sso_codes` enable cross-app login from FloodG8.

## No deploys without approval
This document describes setup only. Do not deploy to production or commit secrets without explicit approval.
