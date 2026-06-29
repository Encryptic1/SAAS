# Standard Workspace — Product Strategy

## Product
Portfolio control panel for the Market Standard suite. One pane shows live health for all 14 Market Standard apps plus FloodG8, SyncDevTime, Supabase, and Stripe. Start `ms-suite dev` sessions and tail logs over Server-Sent Events. Manage webhook tunnels (Cloudflare / localhost) so external webhooks reach local intake routes. Run depsync to verify every app is on the latest shared packages.

## Distribution
- **Primary**: Standalone web app at `workspace.marketstandard.app` (port 3014 local dev)
- **Secondary**: Linked from every app's suite-switcher (the home base)
- **Ecosystem**: FloodG8 + SyncDevTime health probes; Supabase + Stripe dependency checks

## Pricing
| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 1 user, 1 session |
| Starter | $9/mo | 5 sessions + tunnels |
| Growth | $29/mo | Unlimited sessions + team |

Developer-tools lane — ops/reliability buyers who run the whole suite.

## Unit Economics (targets)
- ARPU: $15–$35
- Monthly churn: <5%
- LTV: ~$300–$700
- CAC: $0 (organic) — suite adjacency; every app links here

## KPIs
- Apps healthy / 14 (rolling)
- Sessions started / week
- SSE log connections / day
- Tunnels active
- Depsync divergence events caught

## MVP scope (Phase 11)
- [x] Scaffold `apps/standard-workspace` (port 3014)
- [x] Schema `workspace`: `sessions`, `health_checks`, `tunnels`
- [x] Dashboard: status grid, sessions, tunnels, health, depsync, billing, team
- [x] SSE log stream (`/api/sessions/[id]/logs`)
- [x] Health probes (14 apps + FloodG8 + SyncDevTime + Supabase + Stripe)
- [x] Depsync parity diff (reads every app's package.json)
- [x] Cross-sells: Status, Snippets, Vault, Pulse
- [x] Stripe product `standard-workspace` (free/starter/growth)
- [ ] Cloudflare Tunnel integration (post-MVP — needs `cloudflared` CLI orchestration)
- [ ] Real `ms-suite dev` child-process spawning (post-MVP — needs serverless-safe process manager)

## Cross-sells
- **Standard Status**: build/CI health for any app in the grid
- **Standard Snippets**: runbook snippets for triage
- **Standard Vault**: shared secrets for tunnel providers
- **Suite Pulse**: workspace events (session started, tunnel down) emit Pulse notifications
