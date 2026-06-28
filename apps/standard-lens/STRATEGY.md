# Standard Lens — Product Strategy

## Product
DB query optimizer + slow query detection. Paste a SQL query, get a 0–100 score with anti-pattern findings, an EXPLAIN plan visualizer, and concrete recommendations. Configure a duration threshold per database; anything over it is captured and surfaced on the slow-queries dashboard with Slack + Suite Pulse alerts.

## Distribution
- **Primary**: Standalone web app at `lens.marketstandard.app` (port 3012 local dev)
- **Secondary**: Deep-links from Standard Vault (connection string reference) and Standard Hook (webhook payload regex)
- **Ecosystem**: FloodG8 Settings → Integrations card; agent-reference mode so AI agents can read DB labels without secrets

## Pricing
| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 100 queries/day, 7-day slow history |
| Starter | $29/mo | Unlimited queries, 30-day history |
| Growth | $99/mo | Unlimited + full history + Slack alerts |

Developer-tools lane — buyers are engineers who pay personally or expense it.

## Unit Economics (targets)
- ARPU: $35–$70
- Monthly churn: <6%
- LTV: ~$600–$1,200
- CAC: $0 (organic) — dev communities, FloodG8 cross-sell, Hook adjacency

## KPIs
- Saved queries per user
- EXPLAIN runs / week
- Slow queries captured / week
- Free → paid conversion
- Slack alert delivery rate

## MVP scope (Phase 6.1)
- [x] Scaffold `apps/standard-lens` (copy regex pattern)
- [x] Schema `lens`: `queries`, `slow_queries`
- [x] Dashboard: `/dashboard`, `/dashboard/slow`, `/dashboard/explain`, `/dashboard/billing`
- [x] Heuristic query analyzer (score + findings + pseudo plan)
- [x] Slow query capture API + table
- [x] Cross-sells: Vault (connection string), Hook (payload regex), Pulse (alerts)
- [x] Stripe product `standard-lens` (free/starter/growth)
- [ ] Live `EXPLAIN (FORMAT JSON)` against a connected DB (post-MVP — needs Vault connection string + read-only role)
- [ ] Auto-capture from `pg_stat_statements` (post-MVP)

## Cross-sells
- **Standard Vault**: deep-link to fetch a DB connection string (agent-reference mode) for a database label
- **Standard Hook**: deep-link to test webhook payload regex against captured events
- **Standard Status**: failed pipeline → link to Lens for the query that caused it
- **Suite Pulse**: slow-query overrun emits a Pulse event
