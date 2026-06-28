# Testing — Market Standard SAAS

## Strategy

| Layer | Tool | Command | Scope |
|-------|------|---------|-------|
| Typecheck | `tsc --noEmit` | `pnpm typecheck` | All packages + apps |
| Lint | `tsc --noEmit` | `pnpm lint` | All apps (Biome not yet wired) |
| E2E | Playwright | `pnpm test:e2e:local` | Against `pnpm dev:local` (PGlite + gateway + 11 apps) |
| Screenshots | Playwright | `pnpm exec tsx scripts/baseline-screens.ts` | Desktop 1280×800 + mobile 375×800 |
| Unit (planned) | Vitest | `pnpm test:unit` | Data layer helpers (Phase 5+) |
| Visual (planned) | Playwright snapshots | `pnpm test:visual` | Diff against `screens/baseline/` (Phase 5+) |

## Local dev stack

`pnpm dev:local` starts:
- PGlite (in-memory Postgres) on port 54322
- Gateway service on port 4000 (wraps PGlite, serves app data routes)
- 11 Next.js apps on ports 3001–3011

Wait-on each app's `/api/health` before running specs.

## E2E spec inventory

| Spec | Covers |
|------|--------|
| `dashboards.spec.ts` | Every dashboard overview loads |
| `marketing.spec.ts` | Every marketing home loads |
| `api.spec.ts` | Every `/api/health` returns 200 |
| `billing.spec.ts` | Stripe checkout + portal flows |
| `polls.spec.ts` | Poll CRUD + Slack slash command |
| `proof.spec.ts` | Testimonial collection + embed |
| `metrics.spec.ts` | Stripe Connect + MRR snapshot |
| `hook.spec.ts` | Webhook capture + replay |
| `release.spec.ts` | Release notes from PRs |
| `vault.spec.ts` | Secret CRUD + token mint |
| `links.spec.ts` | Short-link redirect + click tracking |
| `snippets.spec.ts` | Snippet CRUD + version + share |
| `status.spec.ts` | Pipeline + incident + intake webhook |
| `regex.spec.ts` | Pattern test + save + fork |
| `postmortem.spec.ts` | Incident CRUD + recurrence + embed |
| `quota.spec.ts` | Metrics quota monitor |
| `pulse.spec.ts` | Suite Pulse events |
| `theme.spec.ts` | Dark theme + brand tokens |
| `buttons.spec.ts` | Button states + powered-by badge |
| `gateway.spec.ts` | Gateway data routes |
| `new-apps-health.spec.ts` | Tier-B app health (lens/cron stubs) |
| `cross-sell.spec.ts` | **Phase 3** — Hook→Postmortem, Status→Postmortem, Pulse→Postmortem, Regex→Snippets, Metrics→Links deep links |
| `command-palette.spec.ts` | **Phase 2** — ⌘K palette open/search/close + suite switcher |
| `mobile.spec.ts` | **Phase 2** — 375px viewport no-overflow per dashboard |

## Running a single spec

```bash
pnpm exec playwright test e2e/cross-sell.spec.ts
```

## Screenshots

```bash
# Baseline (before polish)
pnpm exec tsx scripts/baseline-screens.ts --which=baseline

# After (post-polish) — filter by app/route
pnpm exec tsx scripts/baseline-screens.ts --which=after --filter=polls/dashboard,metrics/dashboard

# Both viewports captured per route; manifest at screens/{which}/manifest.json
```

## Definition of done (testing)

- `pnpm typecheck` — all 20 packages green
- `pnpm lint` — all 19 apps green
- `pnpm test:e2e:local` — all 24 spec files pass; 250+ tests
- No console errors on any dashboard or marketing page
- Mobile viewport (375px) shows no horizontal overflow
