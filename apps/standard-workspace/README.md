# Standard Workspace

Portfolio control panel for the Market Standard suite, by Market Standard.

One pane shows live health for all 13 Market Standard apps plus FloodG8, SyncDevTime, Supabase, and Stripe. Start dev sessions and tail logs over Server-Sent Events. Manage webhook tunnels so external webhooks reach local intake routes. Run depsync to verify every app is on the latest shared packages.

## Stack
- Next.js 15 (App Router) on port 3014
- `@market-standard/db` (Drizzle + PGlite local / Supabase remote) — `workspace` schema
- `@market-standard/billing` (Stripe) — `standard-workspace` product
- `@market-standard/ui` (MarketingLanding + DashboardShell)

## Local dev
```bash
pnpm dev:local
# http://localhost:3014
```
The PGlite gateway at `http://127.0.0.1:4000` serves the `workspace` schema. Set `LOCAL_DEV=true` to route DB calls through the gateway.

## Routes
| Route | Purpose |
|-------|---------|
| `/` | Marketing landing |
| `/dashboard` | Status grid (14 apps + externals) + KPIs |
| `/dashboard/sessions` | Dev sessions + SSE log viewer |
| `/dashboard/tunnels` | Webhook tunnels (Cloudflare / localhost) |
| `/dashboard/health` | Health-check history |
| `/dashboard/depsync` | Package parity diff across apps |
| `/dashboard/billing` | Stripe checkout / portal |
| `/dashboard/team` | Team + RBAC |
| `/api/sessions` | GET list / POST start a session |
| `/api/sessions/[id]/stop` | POST stop a session |
| `/api/sessions/[id]/logs` | GET SSE log stream |
| `/api/health/run` | POST re-probe all targets |
| `/api/tunnels` | GET list / POST create tunnels |
| `/api/tunnels/[id]` | PATCH / DELETE a tunnel |
| `/api/depsync` | GET package parity report |
| `/api/health` | Health check |

## Schema
- `workspace.sessions` — dev sessions (label, apps, pid, status, log_cursor)
- `workspace.health_checks` — probe results (target, url, status, latency_ms)
- `workspace.tunnels` — webhook tunnels (name, target_app, target_path, public_url, provider)

## SSE log tailing
```bash
curl -N http://localhost:3014/api/sessions/<id>/logs
```
Emits `log` events (JSON `{ line }`) and an `end` event when the session stops.

## Depsync
```bash
curl http://localhost:3014/api/depsync
```
Returns `{ packages, divergent, generatedAt }` comparing `@market-standard/*` versions across all apps.

## Cross-sells
- **Standard Status** — build/CI health for any app in the grid
- **Standard Snippets** — runbook snippets for triage
- **Standard Vault** — shared secrets for tunnel providers
- **Suite Pulse** — workspace events emit Pulse notifications

See `STRATEGY.md` for pricing and roadmap.
