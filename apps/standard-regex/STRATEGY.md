# Standard Regex — Product Strategy

## Product
Regex pattern builder + debugger with an explanation engine. Every token gets a human-readable explanation. Live match highlighting with capture groups, test cases with expected-match assertions, a cheat sheet, and a public pattern library with fork. Deep-links into Standard Hook (save as webhook body filter) and Standard Snippets (save as snippet).

## Viral Loop
- **Within-team**: shared pattern library URLs (`/dashboard/cheat-sheet`, public pattern forks)
- **Cross-team**: public pattern library + fork spreads the brand to other developers
- **Distribution: dev tooling SEO ("regex tester", "regex explainer", "regex cheat sheet") — high search volume**

## Pricing
| Tier | Price | Limits | Badge |
|------|-------|--------|-------|
| Free | $0 | 10 patterns + public library | Yes (required) |
| Starter | $9/mo | Unlimited private + fork + cheat sheet | Removable |

## Unit Economics (targets)
- ARPU: $9
- Monthly churn: <8% (developer tools churn higher)
- LTV: ~$110 at $9 ARPU / 8% churn
- CAC: $0 (organic — SEO is the primary channel; "regex" has massive search volume)

## KPIs
- Patterns created (activation)
- Test cases run (engagement)
- Public patterns + forks (distribution signal)
- Cross-sell clicks to Standard Hook + Standard Snippets
- Free → paid conversion rate

## FloodG8 / SyncDevTime synergy
- **FloodG8 VSIX**: "Test regex from selection" command
- **SyncDevTime**: time spent on regex work is tracked via heartbeat
- **Standard Hook**: "Save as Hook filter" deep link — pattern becomes a webhook body filter
- **Standard Snippets**: "Save regex as snippet" deep link

## Cross-sells
- **Outbound**: pattern → "Save as Hook filter" in Standard Hook
- **Outbound**: pattern → "Save regex as snippet" in Standard Snippets
- **Inbound**: Standard Hook inbox → "Build regex filter" deep link to Standard Regex

## 90-Day Milestones
1. **Week 1–2**: MVP live, 100 beta patterns
2. **Week 3–4**: SEO content (cheat sheet blog posts, token explanation guides)
3. **Month 2**: 1000+ patterns, first paid conversions
4. **Month 3**: Public library SEO dominance + fork analytics
