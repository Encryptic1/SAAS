# Standard Status — Product Strategy

## Product
Unified build/CI/deploy/incident dashboard. One intake webhook accepts events from GitHub Actions, Vercel deployments, and FloodG8 runners. Pipelines show a 30-run sparkline; incidents get severity + one-click resolve; everything cross-links to Standard Postmortem, Standard Hook, and Standard Release.

## Viral Loop
- **Within-team**: incident feed + deploy history shared in standups and Slack
- **Cross-team**: public status page (future Pro feature) exposes the brand
- **Distribution**: dev tooling SEO ("ci dashboard", "deploy monitoring", "github actions status"), FloodG8 extension distribution

## Pricing
| Tier | Price | Limits | Badge |
|------|-------|--------|-------|
| Free | $0 | 3 pipelines · 1 user | Yes (required) |
| Starter | $19/mo | 25 pipelines + auto-sync | Removable |

## Unit Economics (targets)
- ARPU: $19
- Monthly churn: <5%
- LTV: ~$380 at $19 ARPU / 5% churn
- CAC: $0 (organic — SEO + FloodG8 extension distribution)

## KPIs
- Pipelines connected (activation)
- Events ingested per pipeline (engagement)
- Incidents declared (real-world usage signal)
- Cross-sell clicks to Standard Postmortem (incident → retro)
- Free → paid conversion rate

## FloodG8 / SyncDevTime synergy
- **FloodG8 runner relay**: `apps/standard-status/src/app/api/sync/route.ts` pulls FloodG8 runner status; FloodG8 runner appears as a "pipeline" type
- **SyncDevTime**: time spent triaging incidents is tracked via heartbeat (incident_id sent in payload)
- **Standard Postmortem**: failed pipeline → "Create postmortem" deep link
- **Standard Hook**: failed pipeline with webhook trigger → "Debug webhook in Standard Hook"
- **Standard Release**: failed deploy → "View release notes" deep link for rollback context

## Cross-sells
- **Outbound**: failed pipeline → "Create postmortem" in Standard Postmortem
- **Outbound**: failed deploy → "View release notes" in Standard Release
- **Outbound**: failed webhook trigger → "Debug webhook" in Standard Hook

## 90-Day Milestones
1. **Week 1–2**: MVP live, 10 beta pipelines
2. **Week 3–4**: FloodG8 runner relay wired
3. **Month 2**: 100+ pipelines, first paid conversions
4. **Month 3**: Public status page (Pro feature) + GitHub App install flow
