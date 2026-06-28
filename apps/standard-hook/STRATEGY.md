# Standard Hook — Product Strategy

## Product
Webhook capture + replay inbox. Each user gets a unique `/api/capture/{slug}` URL that accepts any HTTP method, stores headers/body/timing, and lets them replay events to localhost or staging with one click.

## Viral Loop
- **Within-team**: developers share inbox URLs when pairing on Stripe/GitHub/Slack integrations
- **Cross-team**: webhook provider docs (Stripe, GitHub) can reference Standard Hook inboxes as a debugging pattern
- **Distribution**: developer tooling SEO ("webhook debugger", "stripe webhook testing"), FloodG8 extension command "Copy webhook URL"

## Pricing
| Tier | Price | Limits | Badge |
|------|-------|--------|-------|
| Free | $0 | 1 inbox · 100 events/mo | Yes (required) |
| Starter | $9/mo | 5 inboxes · 10k events/mo | Removable |

## Unit Economics (targets)
- ARPU: $9 (single-tier MVP)
- Monthly churn: <8% (developer tools churn higher than SaaS)
- LTV: ~$110 at $9 ARPU / 8% churn
- CAC: $0 (organic — SEO + FloodG8 extension distribution)

## KPIs
- Inboxes created (activation)
- Events captured per inbox (engagement)
- Replays triggered (retention signal — user found it useful enough to replay)
- Free → paid conversion rate
- Cross-sell clicks to Standard Postmortem (failed webhooks → incident)

## FloodG8 / SyncDevTime synergy
- **FloodG8 VSIX**: "Copy webhook URL" command pastes inbox URL into terminal
- **FloodG8 Settings**: Integrations tab shows connected inboxes
- **SyncDevTime**: time spent debugging webhooks is tracked via heartbeat
- **Standard Postmortem**: failed webhook (500 response) → "Create postmortem" deep link

## Cross-sells
- **Inbound**: Standard Status failed pipeline with webhook trigger → "Debug webhook in Standard Hook"
- **Inbound**: Standard Regex pattern → "Save as Hook filter" deep link
- **Outbound**: failed event (response_status >= 500) → "Create postmortem" in Standard Postmortem

## 90-Day Milestones
1. **Week 1–2**: MVP live, 25 beta inboxes
2. **Week 3–4**: FloodG8 VSIX integration ships
3. **Month 2**: 200+ inboxes, first paid conversions
4. **Month 3**: Stripe/GitHub webhook recipe blog posts for SEO
