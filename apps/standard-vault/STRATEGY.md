# Standard Vault — Product Strategy

## Product
AES-256-GCM encrypted secrets manager for the AI-agent era. Per-tenant encryption keys, env-injection CLI (`ms-vault run -- <cmd>`), .env/Doppler import, per-project tokens, full audit log, and AI-agent reference mode where agents can discover keys exist without reading values.

## Viral Loop
- **Within-team**: shared project secrets via tokens (team members run `ms-vault run` locally)
- **Cross-team**: agent reference endpoint shared with external AI tools safely
- **Distribution**: dev tooling SEO ("secrets manager", "Doppler alternative", "agent-safe secrets")

## Pricing
| Tier | Price | Limits | Badge |
|------|-------|--------|-------|
| Free | $0 | 1 project · 25 secrets · agent reference | Yes (required) |
| Starter | $19/mo | Unlimited projects · tokens · audit log | Removable |

## Unit Economics (targets)
- ARPU: $19
- Monthly churn: <4% (secrets are sticky — high switching cost)
- LTV: ~$475 at $19 ARPU / 4% churn
- CAC: $0 (organic — SEO + FloodG8 extension distribution)

## KPIs
- Projects created (activation)
- Secrets per project (engagement)
- Tokens minted (integration signal)
- Agent reference toggles enabled (AI-era adoption signal)
- Free → paid conversion rate

## FloodG8 / SyncDevTime synergy
- **FloodG8 VSIX**: "Vault: Inject into Terminal" command runs `ms-vault run` for the active project
- **FloodG8 Settings**: Integrations tab shows connected Vault projects
- **SyncDevTime**: time spent managing secrets is tracked
- **All Standard apps**: document how to wire `STRIPE_SECRET_KEY` etc. via Vault reference instead of env var

## Cross-sells
- **Outbound**: every Standard app documents Vault reference mode for its own secrets
- **Outbound**: Standard Snippets saves `ms-vault run --filter=...` commands as snippets

## 90-Day Milestones
1. **Week 1–2**: MVP live, 25 beta projects
2. **Week 3–4**: FloodG8 VSIX "Inject into Terminal" ships
3. **Month 2**: 200+ projects, first paid conversions
4. **Month 3**: GitHub Action for CI secrets injection (Agent Skill pack)
