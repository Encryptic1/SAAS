# Environment Variables — Market Standard SAAS

Each app deploys as its own Vercel project with its own env vars. This is the full matrix. Local dev uses PGlite via `pnpm dev:local` — only `NEXT_PUBLIC_LOCAL_DEV=true` and `NEXT_PUBLIC_LOCAL_GATEWAY=true` are required locally.

## Shared (every app)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | prod | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | prod | Supabase service role key (server only) |
| `STRIPE_SECRET_KEY` | prod | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | prod | Per-app Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | prod | Stripe publishable key |
| `NEXT_PUBLIC_APP_URL` | prod | The app's canonical URL (e.g. `https://polls.marketstandard.io`) |
| `CRON_SECRET` | prod | Shared secret for Vercel Cron → app API routes |
| `NEXT_PUBLIC_LOCAL_DEV` | local | `true` in local dev |
| `NEXT_PUBLIC_LOCAL_GATEWAY` | local | `true` to route DB calls through the gateway on port 4000 |

## Cross-app URLs (for deep links)

| Variable | Used by | Default (local) |
|----------|---------|------------------|
| `NEXT_PUBLIC_POSTMORTEM_URL` | Hook, Status | `http://localhost:3011` |
| `NEXT_PUBLIC_HOOK_URL` | Status, Regex | `http://localhost:3004` |
| `NEXT_PUBLIC_RELEASE_URL` | Status | `http://localhost:3005` |
| `NEXT_PUBLIC_SNIPPETS_URL` | Regex | `http://localhost:3008` |
| `NEXT_PUBLIC_LINKS_URL` | Metrics | `http://localhost:3007` |
| `NEXT_PUBLIC_METRICS_URL` | Links | `http://localhost:3003` |

## Per-app extras

### standard-polls (3001)
| Variable | Description |
|----------|-------------|
| `SLACK_CLIENT_ID` | Slack app client ID |
| `SLACK_CLIENT_SECRET` | Slack app client secret |
| `SLACK_BOT_TOKEN` | (per-workspace, stored in DB) |
| `SLACK_SIGNING_SECRET` | Slack request signing secret |

### standard-metrics (3003) + standard-links (3007)
| Variable | Description |
|----------|-------------|
| `STRIPE_CONNECT_CLIENT_ID` | Stripe Connect platform client ID |

### standard-release (3005) + standard-status (3009)
| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub App / PAT for PR + workflow fetch |

### standard-status (3009)
| Variable | Description |
|----------|-------------|
| `VERCEL_TOKEN` | Vercel API token for deployment status |
| `VERCEL_PROJECT_ID` | Vercel project ID to monitor |
| `STATUS_INTAKE_SECRET` | Bearer token for `/api/intake` webhook |

### standard-postmortem (3011)
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | For `text-embedding-3-small` recurrence embeddings |

### standard-vault (3006)
| Variable | Description |
|----------|-------------|
| `VAULT_MASTER_KEY` | AES-256-GCM master key for secret encryption |

## Vercel setup

Use `scripts/setup-vercel-envs.ts` to bulk-set env vars across all 11 Vercel projects. The script reads this matrix and the `.env.example` at the repo root.

### Current Vercel state (verified via MCP 2026-06-28)

The Market Standard team (`team_HCZ0VPVBdQ0gPMFyHjpPEdAK`) currently has `prod-market-standard` + `staging-market-standard` projects but **no per-app projects yet** (no `standard-polls`, `standard-metrics`, etc.). Per the build plan, the 11 per-app Vercel projects are created at deploy time in the Final phase ("Vercel deploy per app via MCP/CLI ONLY after user approval"). The env-var push happens immediately after each project is created + linked.

### Deploy-time env var procedure (Final phase)

```bash
# 1. Install + auth the Vercel CLI
npm i -g vercel
vercel login

# 2. Create + link each per-app project
cd apps/standard-polls && vercel link --yes --project standard-polls --scope marketstandard && cd ../..
# ...repeat for the other 10 apps...

# 3. Export shared secrets into your shell
export STRIPE_SECRET_KEY=sk_live_...
export STRIPE_WEBHOOK_SECRET_polls=whsec_...   # per-app webhook secrets
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
export NEXT_PUBLIC_SUPABASE_URL=https://opodtvblrelmpoaprmpr.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # from Supabase MCP get_publishable_keys
export SUPABASE_SERVICE_ROLE_KEY=eyJ...       # from Supabase dashboard (secret)

# 4. Push all env vars (script resolves STRIPE_PRICE_* from root .env.example)
pnpm exec tsx scripts/setup-vercel-envs.ts
```

The Stripe price IDs in the root `.env.example` are already verified against the live Stripe account via the Stripe MCP (all 13 Standard products + their Starter prices confirmed).

## Stripe webhook endpoints

Each app has a Stripe webhook at `https://{app}.marketstandard.io/api/webhooks/stripe`. Configure one webhook endpoint per app in the Stripe dashboard and set the signing secret as `STRIPE_WEBHOOK_SECRET`.

## Cron entries (vercel.json)

| App | Schedule | Route |
|-----|----------|-------|
| standard-metrics | daily 6am UTC | `/api/cron/sync` |
| standard-polls | daily 9am UTC | `/api/cron/digest` |
| standard-polls | weekdays 2pm UTC | `/api/cron/standup` |
| standard-polls | weekdays 5pm UTC | `/api/cron/standup-digest` |
