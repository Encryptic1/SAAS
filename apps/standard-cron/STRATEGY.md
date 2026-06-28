# Standard Cron — Product Strategy

## Product
Cron monitor for Vercel Cron, GitHub Actions, and FloodG8 runners. Each job gets a heartbeat URL — ping it when the job runs. A missed window (schedule + grace) triggers Slack + Suite Pulse alerts. Run history is retained per job so flaky schedules are obvious.

## Distribution
- **Primary**: Standalone web app at `cron.marketstandard.app` (port 3013 local dev)
- **Secondary**: Deep-links from Standard Hook (failed webhook → cron blame) and Standard Status (CI pane + cron health side-by-side)
- **Ecosystem**: FloodG8 runners auto-register a heartbeat on each floodlog clear

## Pricing
| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 3 jobs, 7-day history |
| Starter | $19/mo | 25 jobs, 30-day history |
| Growth | $49/mo | Unlimited jobs, full history, Slack alerts |

Developer-tools lane — reliability buyers (SRE/ops-curious engineers).

## Unit Economics (targets)
- ARPU: $25–$45
- Monthly churn: <5%
- LTV: ~$500–$900
- CAC: $0 (organic) — dev communities, Hook adjacency, FloodG8 runners

## KPIs
- Jobs registered per user
- Heartbeats received / day
- Missed-run alerts fired / week
- Free → paid conversion
- Slack alert delivery rate

## MVP scope (Phase 6.2)
- [x] Scaffold `apps/standard-cron` (copy status pattern)
- [x] Schema `cron`: `jobs`, `runs`
- [x] Dashboard: `/dashboard`, `/dashboard/[id]`, `/dashboard/billing`
- [x] Heartbeat URL per job (token-based, no auth)
- [x] 5-field cron parser + human-readable summary
- [x] Run history table (last 30 runs)
- [x] Cross-sells: Hook, Status, Vault, Pulse
- [x] Stripe product `standard-cron` (free/starter/growth)
- [ ] Missed-window detection cron (post-MVP — Vercel Cron scans jobs past window+grace)
- [ ] Slack delivery (post-MVP — needs Slack webhook URL stored per job)

## Cross-sells
- **Standard Hook**: failed webhook → link to Cron for the job that was supposed to fire it
- **Standard Status**: CI pane + cron health side-by-side
- **Standard Vault**: store the heartbeat token / Slack webhook
- **Suite Pulse**: missed run emits a Pulse event
