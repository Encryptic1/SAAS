# Standard Metrics — Product Strategy

## Product
Stripe subscription analytics dashboard. Connect a Stripe account (read-only OAuth), view MRR, ARR, churn, LTV, and active subscription counts.

## Distribution
- **Primary**: Standalone web app with Stripe Connect OAuth (fastest to launch)
- **Secondary**: Stripe App Marketplace listing for organic discovery within Stripe Dashboard
- **Constraint**: A Connect-enabled Stripe account cannot publish a Stripe App. Plan:
  1. Launch as standalone OAuth web app on main Stripe account
  2. Later add thin Marketplace listing under a separate Stripe account for discovery only

## Pricing
| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 30-day history |
| Starter | $29/mo | 1-year history |
| Growth | $79/mo | Unlimited history + segment breakdown |

Highest ARPU product in the portfolio — Stripe merchants are used to paying for analytics tools.

## Unit Economics (targets)
- ARPU: $40–$80
- Monthly churn: <4% (high-value B2B)
- LTV: ~$1,000–$2,000
- CAC: $0 (organic) — Stripe Marketplace + founder community word-of-mouth

## KPIs
- Stripe accounts connected
- Daily sync success rate
- Dashboard views / week
- Free → paid conversion
- Stripe Marketplace listing views (when listed)

## Stripe App Marketplace Checklist (future)
- [ ] Separate Stripe account (non-Connect) for app publishing
- [ ] UI Extension or OAuth app manifest
- [ ] App listing with screenshots, pricing, privacy policy
- [ ] Submit for Stripe review
- [ ] Join Stripe Partner Program (Apps Track)

## Server Load & Performance
- **Pre-computed aggregates**: Vercel Cron (`0 6 * * *`) syncs all accounts daily; dashboard reads from `metric_snapshots` table (no live Stripe API calls on page load)
- **ISR caching**: dashboard revalidates every 300s
- **Stripe API pagination**: cron job paginates subscriptions (limit 100, auto-paginate for larger accounts)
- **Rate limits**: respect Stripe rate limits with exponential backoff in cron
- **No real-time**: daily snapshots are sufficient for MRR/churn; upgrade path is hourly for Growth tier

## 90-Day Milestones
1. **Week 1–2**: OAuth connect + dashboard with stub metrics live
2. **Week 3–4**: Cron sync working, 5 beta Stripe accounts connected
3. **Month 2**: Accurate MRR/churn/LTV calculations, first paid users
4. **Month 3**: Stripe App Marketplace submission on separate account
