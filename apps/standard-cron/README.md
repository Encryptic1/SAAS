# Standard Cron

Cron monitor + alerting, by Market Standard.

Monitor cron jobs across Vercel Cron, GitHub Actions, and FloodG8 runners. Each job gets a unique heartbeat URL — ping it when the job runs. If a window is missed (schedule + grace), Standard Cron alerts Slack and Suite Pulse. Run history is retained per job so flaky schedules are obvious.

## Stack
- Next.js 15 (App Router) on port 3013
- `@market-standard/db` (Drizzle + PGlite local / Supabase remote) — `cron` schema
- `@market-standard/billing` (Stripe) — `standard-cron` product
- `@market-standard/ui` (MarketingLanding + DashboardShell)

## Local dev
```bash
pnpm dev:local
# http://localhost:3013
```
The PGlite gateway at `http://127.0.0.1:4000` serves the `cron` schema. Set `LOCAL_DEV=true` to route DB calls through the gateway.

## Routes
| Route | Purpose |
|-------|---------|
| `/` | Marketing landing |
| `/dashboard` | Job list + KPIs + create form |
| `/dashboard/[id]` | Job detail + heartbeat URL + run history |
| `/dashboard/billing` | Stripe checkout / portal |
| `/api/jobs` | GET list / POST create jobs |
| `/api/jobs/[id]` | GET / PATCH / DELETE a job |
| `/api/jobs/[id]/runs` | POST a manual run record |
| `/api/heartbeat/[token]` | Public heartbeat ping (no auth) |
| `/api/health` | Health check |

## Schema
- `cron.jobs` — monitored jobs (name, schedule_cron, source, expected_window_minutes, grace_minutes, alert_channel, heartbeat_token, last_run_at, last_status)
- `cron.runs` — recorded runs (job_id, status, started_at, finished_at, duration_ms)

## Heartbeat usage
```bash
# OK run
curl -X POST https://cron.marketstandard.app/api/heartbeat/<token>

# Failed run
curl -X POST -H "Content-Type: application/json" \
  -d '{"status":"failed","durationMs":4200}' \
  https://cron.marketstandard.app/api/heartbeat/<token>
```

## Cross-sells
- **Standard Hook** — debug the webhook that was supposed to fire the cron
- **Standard Status** — CI pane alongside cron health
- **Standard Vault** — store the heartbeat token / Slack webhook
- **Suite Pulse** — missed run emits a Pulse event

See `STRATEGY.md` for pricing and roadmap.
