# Standard Postmortem — Product Strategy

## Product
Blameless incident postmortem tool with the classic template (Summary, Timeline, Root Cause, What went well / didn't / got lucky), action items with due dates, and recurrence detection via `pgvector` embeddings on root-cause text. Intake flows in from Standard Hook (failed webhooks), Standard Status (failed pipelines/deploys), Suite Pulse (blocker keywords), and Slack.

## Viral Loop
- **Within-team**: postmortems are shared in retros and onboarding
- **Cross-team: public postmortem templates + recurrence graph (future Pro feature) expose the brand**
- **Distribution**: dev tooling SEO ("postmortem template", "incident retrospective", "blameless postmortem"), FloodG8 extension distribution

## Pricing
| Tier | Price | Limits | Badge |
|------|-------|--------|-------|
| Free | $0 | 5 incidents/mo | Yes (required) |
| Starter | $19/mo | Unlimited + recurrence + reminders | Removable |

## Unit Economics (targets)
- ARPU: $19
- Monthly churn: <4% (postmortems are sticky — historical record)
- LTV: ~$475 at $19 ARPU / 4% churn
- CAC: $0 (organic — SEO + FloodG8 extension distribution)

## KPIs
- Incidents created (activation)
- Action items completed (engagement — follow-through signal)
- Recurrence suggestions accepted (AI feature adoption)
- Intake events from Hook/Status/Pulse (ecosystem signal)
- Free → paid conversion rate

## FloodG8 / SyncDevTime synergy
- **FloodG8 Suite Pulse**: blocker keywords in standup → "Create postmortem" suggestion
- **SyncDevTime**: time spent on incident response is tracked via heartbeat (incident_id sent in payload) — measures real cost of incidents
- **Standard Hook**: failed webhook (500 response) → "Create postmortem" deep link with event metadata pre-filled
- **Standard Status**: failed pipeline/deploy → "Create postmortem" deep link with incident timeline pre-filled

## Cross-sells
- **Inbound**: Standard Hook 500 event → "Create postmortem" with `source=hook&event_id={id}&inbox_slug={slug}`
- **Inbound**: Standard Status failed pipeline → "Create postmortem" with `source=status&pipeline_id={id}`
- **Inbound**: Suite Pulse blocker → "Create postmortem" with `source=pulse&blocker_text={text}`
- **Outbound**: recurrence graph → "View linked incident" deep link

## 90-Day Milestones
1. **Week 1–2**: MVP live, 25 beta incidents
2. **Week 3–4**: Recurrence detection (pgvector) ships
3. **Month 2**: 200+ incidents, first paid conversions
4. **Month 3**: Public postmortem template library + Slack `/postmortem create` slash command
