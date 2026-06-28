# Standard Lens

DB query optimizer + slow query detection, by Market Standard.

Paste a SQL query, get a 0–100 score with anti-pattern findings (SELECT *, full scans, function-on-column, NOT IN, unconstrained joins, unbounded sorts), an EXPLAIN plan visualizer, and concrete recommendations. Configure a duration threshold per database and capture overruns to the slow-queries dashboard with Slack + Suite Pulse alerts.

## Stack
- Next.js 15 (App Router) on port 3012
- `@market-standard/db` (Drizzle + PGlite local / Supabase remote) — `lens` schema
- `@market-standard/billing` (Stripe) — `standard-lens` product
- `@market-standard/ui` (MarketingLanding + DashboardShell)

## Local dev
```bash
pnpm dev:local
# http://localhost:3012
```
The PGlite gateway at `http://127.0.0.1:4000` serves the `lens` schema. Set `LOCAL_DEV=true` to route DB calls through the gateway.

## Routes
| Route | Purpose |
|-------|---------|
| `/` | Marketing landing |
| `/dashboard` | Saved query library + KPIs + create form |
| `/dashboard/slow` | Slow query captures table |
| `/dashboard/explain` | EXPLAIN analyzer tool (score + plan + findings) |
| `/dashboard/billing` | Stripe checkout / portal |
| `/api/queries` | GET list / POST create saved queries |
| `/api/queries/[id]` | GET / PATCH / DELETE a saved query |
| `/api/queries/explain` | POST `{ sql }` → `{ score, findings, plan, recommendations }` |
| `/api/slow` | GET list / POST record a slow query capture |
| `/api/health` | Health check |

## Schema
- `lens.queries` — saved queries (name, sql_text, database_label, avg_ms, last_explain, tags, is_pinned)
- `lens.slow_queries` — captured overruns (query_hash, sql_text, duration_ms, threshold_ms, source, captured_at)

## Cross-sells
- **Standard Vault** — fetch the DB connection string for a database label
- **Standard Hook** — test webhook payload regex against captured events
- **Standard Status** — failed pipeline → Lens for the query blame
- **Suite Pulse** — slow-query overrun emits a Pulse event

See `STRATEGY.md` for pricing and roadmap.
