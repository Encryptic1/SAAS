# Standard Proof — Product Strategy

## Product
Testimonial / social-proof "Wall of Love". Customers collect testimonials, approve them in a dashboard, and embed a widget on their public sites.

## Exposure Model (Powered-By)
Every embed and public collection page carries a "Powered by Market Standard" badge visible to the customer's entire audience:
- **Website visitors** see the badge on embedded widgets
- **Public collection pages** (`/c/{slug}`) are indexable and shareable
- **Collection form** links can be shared for testimonial gathering

This is the broadest exposure product in the portfolio — one customer's site traffic becomes your marketing.

## Embed Targets (priority order)
1. **Custom HTML / any site** — `<script>` + `data-proof-collection` (no marketplace gate)
2. **Webflow / Framer** — embed code in custom code blocks
3. **WordPress** — plugin or shortcode (future)
4. **Shopify** — App Store listing (requires Built for Shopify: 50 paid installs, GraphQL, <500ms)

## Pricing
| Tier | Price | Limits | Badge |
|------|-------|--------|-------|
| Free | $0 | 1 collection, 10 testimonials | Yes (required) |
| Starter | $19/mo | 3 collections, 50 testimonials | Removable |
| Growth | $49/mo | Unlimited | Removable |

Removing the badge is the primary paid upsell — it directly reduces viral exposure, so customers who care about branding will pay.

## Unit Economics (targets)
- ARPU: $25–$40
- Monthly churn: <5%
- LTV: ~$500–$800
- CAC: $0 (organic) — embed badge impressions + public page SEO

## KPIs
- Collections created
- Testimonials submitted / approved
- Embed installs (script loads tracked via first-party events)
- Badge click-through rate
- Public page views (`/c/{slug}`)
- Free → paid (badge removal)

## Server Load & Performance
- **ISR caching**: public pages and embed routes revalidate every 3600s
- **CDN edge**: embed JS and iframe HTML served with `s-maxage=3600, stale-while-revalidate=86400`
- **Supabase Storage**: testimonial avatars/media (not on request path for embeds)
- **Lazy iframe**: embed script uses `loading="lazy"` for below-fold widgets
- **No real-time**: testimonials don't need WebSockets; polling on dashboard only

## 90-Day Milestones
1. **Week 1–2**: Dashboard + embed widget live
2. **Week 3–4**: 10 beta users with live embeds on real sites
3. **Month 2**: Webflow/Framer integration guides, measure badge CTR
4. **Month 3**: First paid conversions (badge removal), consider WordPress plugin
