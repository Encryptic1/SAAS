# Standard Polls — Product Strategy

## Product
Slack poll/survey bot. `/poll Question? | Option A | Option B` creates an in-channel interactive poll with vote buttons.

## Viral Loop
Every poll posts to the channel with a Block Kit footer:
> Powered by Market Standard — Add to Slack

- **Within-workspace**: entire channel sees the poll and footer
- **Cross-workspace**: Slack Connect shared channels expose polls to external teams
- **Marketplace**: Slack App Directory organic search for "poll", "survey", "vote"

## Pricing
| Tier | Price | Limits | Badge |
|------|-------|--------|-------|
| Free | $0 | 10 polls/month | Yes (required) |
| Starter | $19/mo | 100 polls/month | Removable |
| Growth | $49/mo | Unlimited | Removable |

Annual discount: 15% off.

## Unit Economics (targets)
- ARPU: $27–$36 (Shopify app benchmark)
- Monthly churn: <5%
- LTV: ~$540 at $27 ARPU / 5% churn
- CAC: $0 (organic only) — marketplace listing SEO + viral footer

## KPIs
- Workspace installs
- Polls created / month (activation)
- Free → paid conversion rate
- Badge click-through rate (exposure metric)
- 7-day retention (second poll created)

## Slack Marketplace Listing Checklist
- [ ] Unique, searchable app name
- [ ] 30–90s demo video (YouTube, captions, no ads)
- [ ] 4 screenshots showing real Slack workflow
- [ ] Public landing page with privacy policy
- [ ] Support email with <2 business day response SLA
- [ ] Minimal OAuth scopes (commands, chat:write, channels:read)
- [ ] Respond to support within 2 business days

## Server Load & Performance
- **Ack-first pattern**: `@vercel/slack-bolt` + `waitUntil` for deferred work
- **Fluid Compute**: enable on Vercel project for extended function lifetime
- **Queue-ready**: if jobs exceed function limits, offload to Vercel Queues/Inngest
- **DB**: poll/vote writes are lightweight; cache workspace plan in memory per request
- **No polling**: event-driven only (slash commands + button actions)

## 90-Day Milestones
1. **Week 1–2**: MVP live, 5 beta workspaces
2. **Week 3–4**: Slack Marketplace submission
3. **Month 2**: 50+ installs, 5+ reviews (Slack quality signal)
4. **Month 3**: First paid conversions, iterate on listing SEO
