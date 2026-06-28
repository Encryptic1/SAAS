# Standard Links — Product Strategy

## Product
Stripe payment link brander + click tracker. Paste a `buy.stripe.com/...` URL, get a branded `/go/<slug>` short link that records every click with referrer/UA/UTM metadata, then redirects. Cross-sells into Standard Metrics for conversion attribution.

## Viral Loop
- **Within-team**: every shared payment link carries the brand domain
- **Cross-team**: public `/go/<slug>` URLs are visible to buyers (viral exposure)
- **Distribution**: Stripe App Marketplace listing, SEO ("payment link tracker", "stripe link shortener")

## Pricing
| Tier | Price | Limits | Badge |
|------|-------|--------|-------|
| Free | $0 | 3 links · click tracking | Yes (required) |
| Starter | $19/mo | Unlimited links · UTM passthrough | Removable |

## Unit Economics (targets)
- ARPU: $19
- Monthly churn: <5%
- LTV: ~$380 at $19 ARPU / 5% churn
- CAC: $0 (organic — Stripe Marketplace + SEO)

## KPIs
- Links created (activation)
- Clicks per link (engagement)
- UTM passthrough usage (advanced feature adoption)
- Cross-sell clicks to Standard Metrics (conversion attribution)
- Free → paid conversion rate

## FloodG8 / SyncDevTime synergy
- **Standard Metrics**: shared Stripe Connect OAuth + `stripe_accounts` table — links revenue shows up alongside MRR
- **FloodG8 Settings**: Integrations tab shows link performance
- **SyncDevTime**: time spent on link campaigns is tracked

## Cross-sells
- **Inbound**: Standard Metrics dashboard → "Create payment link" deep link
- **Outbound**: link analytics widget rendered on Standard Metrics dashboard (revenue-per-link breakdown)

## 90-Day Milestones
1. **Week 1–2**: MVP live, 25 beta links
2. **Week 3–4**: Stripe App Marketplace listing submitted
3. **Month 2**: 500+ links, first paid conversions
4. **Month 3**: QR code generation + bulk import (Pro features)
