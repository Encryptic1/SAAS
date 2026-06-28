# Market Standard, LLC — Portfolio Strategy

## Company
**Market Standard, LLC** builds micro-SaaS products distributed through marketplace organic discovery and built-in viral loops — no paid ads, no social marketing.

## Product Portfolio (ranked by fastest path to revenue)

| Rank | Product | Time to Revenue | Exposure Mechanism | ARPU Target |
|------|---------|----------------|-------------------|-------------|
| 1 | **Standard Polls** (Slack) | Weeks | Every poll visible to whole channel + Slack Marketplace | $27–$36 |
| 2 | **Standard Proof** (Testimonials) | ~1 month | Embed badge on customer sites + public pages | $25–$40 |
| 3 | **Standard Metrics** (Stripe) | ~1 month | Stripe App Marketplace + founder audience | $40–$80 |

### Why not the report's top picks?
The [deep-research-report.md](../deep-research-report.md) ranked Shopify Image Optimizer and similar apps highest, but those case studies relied heavily on **paid marketplace ads** (Helium: 14× ROAS on Shopify App Store ads). With no paid ads or social marketing, we re-ranked for:
1. **Built-in virality** — usage itself exposes the product to new users
2. **Marketplace organic discovery** — listing SEO, reviews, platform recommendations
3. **Stack fit** — Vercel + Supabase + Stripe without heavy infrastructure

## Shared Exposure Model

```
Customer uses product
  → Public artifact shows "Powered by Market Standard"
    → New audience sees it (teammates / site visitors / merchants)
      → Clicks CTA or finds marketplace listing
        → Installs / signs up
          → (loop repeats)
```

**Viral monetization lever**: Free tiers require the "Powered by" badge. Removing it is a paid upsell — customers who care about branding pay, and free users continue marketing for us.

## Tech Stack
| Layer | Tool | Role |
|-------|------|------|
| Hosting | Vercel | One project per app, Fluid Compute for Slack |
| Database | Supabase (Postgres) | Per-product schemas with RLS |
| ORM | Drizzle | Type-safe schema, migrations |
| Billing | Stripe | Subscriptions, Connect OAuth, webhooks |
| Auth | Supabase Auth + platform OAuth | Dashboard login, Slack/Stripe install |
| Monorepo | Turborepo + pnpm | Shared packages, independent deploys |

## KPI Definitions (portfolio-wide)
| KPI | Definition | Target |
|-----|-----------|--------|
| MRR | Monthly recurring revenue across all products | Track per-product + total |
| Installs | Platform-specific (Slack workspace, embed, Stripe connect) | Growth rate >3% MoM |
| Activation | First meaningful action (poll created, embed live, dashboard viewed) | >60% within 7 days |
| Trial-to-paid | Free → paid conversion | >5% within 30 days |
| Badge CTR | Clicks on "Powered by" / total impressions | >0.5% |
| Churn | Monthly subscription cancellations | <5% |
| ARPU | MRR / paying customers | Varies by product |
| LTV | ARPU / monthly churn | >3× CAC (CAC = $0 for organic) |

First-party KPI events are stored in `shared.kpi_events` (Supabase) — no third-party trackers required.

## 90-Day Roadmap

### Month 1: Launch Polls + Proof skeletons
- Week 1–2: Standard Polls MVP live, 5 beta Slack workspaces
- Week 3–4: Standard Proof embed widget live, 10 beta embeds on real sites
- Submit Slack Marketplace listing

### Month 2: Launch Metrics + iterate
- Week 5–6: Standard Metrics OAuth + cron sync live, 5 beta Stripe accounts
- Week 7–8: Iterate on listing SEO, gather reviews, measure badge CTR
- First paid conversions on Polls

### Month 3: Scale organic discovery
- 50+ Slack installs, 5+ reviews
- 20+ live Proof embeds
- 10+ connected Stripe accounts
- Submit Stripe App Marketplace listing (separate account)
- Portfolio MRR target: $500–$1,500 (conservative)

## Financial Projection (12-month, adapted from report)

Assumptions: $30 blended ARPU, 5% monthly churn, organic-only acquisition (CAC = $0).

| Month | Conservative MRR | Likely MRR | Optimistic MRR |
|-------|-------------------|------------|----------------|
| 1 | $0 | $60 | $150 |
| 2 | $30 | $120 | $300 |
| 3 | $90 | $240 | $600 |
| 4 | $150 | $400 | $1,000 |
| 5 | $220 | $550 | $1,400 |
| 6 | $300 | $700 | $1,800 |
| 7 | $390 | $850 | $2,200 |
| 8 | $490 | $1,000 | $2,600 |
| 9 | $590 | $1,150 | $3,000 |
| 10 | $690 | $1,300 | $3,400 |
| 11 | $790 | $1,450 | $3,800 |
| 12 | $890 | $1,600 | $4,200 |

Conservative: ~3 new paying customers/month across portfolio starting month 2.
Likely: ~5 new paying customers/month.
Optimistic: ~12 new paying customers/month.

At Likely scenario, Year 1 ARR ≈ $19,200. At Optimistic, ≈ $50,400.

Unit economics with $0 CAC and 5% churn: LTV = $30 / 0.05 = $600 per customer. Every paying customer is immediately profitable.

## Risk Mitigation
| Risk | Mitigation |
|------|-----------|
| Platform API changes | Modular integration code per app; follow platform changelogs |
| Slow organic growth | Built-in viral loops compound over time; prioritize badge CTR optimization |
| Stripe App publishing constraint | Launch Metrics as standalone OAuth first; Marketplace listing later |
| Server load spikes | Pre-computed aggregates (Metrics), ISR caching (Proof), ack-first + waitUntil (Polls) |
| Competition | Niche focus, performance optimization, marketplace listing quality |

## Per-Product Strategy Docs
- [Standard Polls](../apps/standard-polls/STRATEGY.md)
- [Standard Proof](../apps/standard-proof/STRATEGY.md)
- [Standard Metrics](../apps/standard-metrics/STRATEGY.md)
