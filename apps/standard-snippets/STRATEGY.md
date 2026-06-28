# Standard Snippets — Product Strategy

## Product
Code snippet manager built for the AI-agent era. Save from VS Code selection, tag + search, auto-version every edit, share via signed URL, and insert into FloodG8 Plan Editor with `[[snippet:abc]]` references that always resolve to the latest version.

## Viral Loop
- **Within-team**: shared snippet URLs (`/s/<slug>`) spread across PR reviews and docs
- **Cross-team**: `[[snippet:]]` references in FloodG8 plans render for collaborators
- **Distribution**: VS Code Marketplace (FloodG8 extension ships the save-from-selection command), dev SEO ("snippet manager", "code snippet sharing")

## Pricing
| Tier | Price | Limits | Badge |
|------|-------|--------|-------|
| Free | $0 | 25 snippets · 1 user | Yes (required) |
| Starter | $9/mo | 500 snippets + sharing | Removable |

## Unit Economics (targets)
- ARPU: $9
- Monthly churn: <7%
- LTV: ~$128 at $9 ARPU / 7% churn
- CAC: $0 (organic — VS Code Marketplace + FloodG8 extension distribution)

## KPIs
- Snippets created (activation)
- Versions per snippet (engagement — editing signal)
- Share URLs minted (distribution signal)
- `[[snippet:]]` references inserted into FloodG8 plans (ecosystem signal)
- Free → paid conversion rate

## FloodG8 / SyncDevTime synergy
- **FloodG8 VSIX**: "Save as snippet" command from selection; Plan Editor resolves `[[snippet:]]` references
- **FloodG8 Plan Editor**: `/api/snippets/[id]/resolve` endpoint returns latest version body
- **SyncDevTime**: time spent editing snippets is tracked via heartbeat
- **Standard Regex**: "Save regex as snippet" deep link

## Cross-sells
- **Inbound**: Standard Regex pattern → "Save regex as snippet" deep link
- **Outbound**: `[[snippet:]]` reference syntax documented for FloodG8 Plan Editor

## 90-Day Milestones
1. **Week 1–2**: MVP live, 50 beta snippets
2. **Week 3–4**: FloodG8 VSIX "Save as snippet" ships
3. **Month 2**: 500+ snippets, first paid conversions
4. **Month 3**: Full-text search + team workspaces (Pro features)
