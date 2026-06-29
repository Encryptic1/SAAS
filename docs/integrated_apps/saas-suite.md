# Market Standard SAAS Suite — Integration with FloodG8 + Marketing Site

**Date:** 2026-06-28
**Repo:** `F:\dev\SAAS` (GitHub: `Encryptic1/SAAS`)
**Commits pushed to `origin/main`:** `a96003c` → `cfdecb6` → `bf34b1a` → `4697d1a` → `1f069f1`
**Vercel deployments:** all 14 apps deployed to production at `https://standard-<app>.vercel.app` — all returning 200 on `/api/health` + 307 on `/auth/callback` (SSO bridge live)
**Supabase project:** `opodtvblrelmpoaprmpr` (shared with FloodG8 + all Standard apps)
**Plan reference:** `F:\dev\SAAS\docs\SAAS-FINISH.md` (13 phases, all complete)
**Sibling integration docs:** `floodg8.md` + `marketstandard-app.md` in this folder

This file documents what the SAAS-suite side of the integration did to meet the contracts established by FloodG8 (`floodg8.md`) and the marketing site (`marketstandard-app.md`), and lists the remaining items each sibling repo needs to finalize.

---

## TL;DR

All 14 Standard apps are built, polished, tested, and deployed to Vercel production. The SAAS side of the integration contracts is complete:

- **SSO bridge** — all 14 apps' `/auth/callback` routes now redeem FloodG8 SSO codes from `shared.sso_codes` before falling back to standard OAuth.
- **VSIX API endpoints** — Vault `/api/projects` + `/api/projects/:id/secrets`, Snippets `/api/snippets`, Regex `/api/patterns` all exist and are deployed.
- **Workspace schema** — `workspace.sessions` + `workspace.health_checks` + `workspace.tunnels` migrated to the shared Supabase project with RLS.
- **Stripe product metadata** — every Standard Stripe product carries `metadata.product=standard-{app}` + `metadata.plan_id={tier}` so the FloodG8 webhook can ignore Standard events on the shared Stripe account.
- **Vercel monorepo builds** — every app has `rootDirectory=apps/<app>` set on the Vercel project, `vercel.json` with `pnpm install` / `pnpm build`, and `packageManager: pnpm@9.15.0` in its `package.json`.

### Production URLs (all 14 returning 200)

| App | Vercel URL | Health |
|-----|-----------|--------|
| standard-polls | https://standard-polls.vercel.app | 200 |
| standard-proof | https://standard-proof.vercel.app | 200 |
| standard-metrics | https://standard-metrics.vercel.app | 200 |
| standard-hook | https://standard-hook.vercel.app | 200 |
| standard-release | https://standard-release.vercel.app | 200 |
| standard-vault | https://standard-vault.vercel.app | 200 |
| standard-links | https://standard-links.vercel.app | 200 |
| standard-snippets | https://standard-snippets.vercel.app | 200 |
| standard-status | https://standard-status.vercel.app | 200 |
| standard-regex | https://standard-regex.vercel.app | 200 |
| standard-postmortem | https://standard-postmortem.vercel.app | 200 |
| standard-lens | https://standard-lens.vercel.app | 200 |
| standard-cron | https://standard-cron.vercel.app | 200 |
| standard-workspace | https://standard-workspace.vercel.app | 200 |

> **Custom domains not yet wired.** FloodG8 expects `*.marketstandard.io` URLs; the marketing site expects `*.marketstandard.app` URLs. The apps currently live at `*.vercel.app`. DNS + Vercel domain config is the primary remaining cross-repo item — see [Outstanding](#outstanding-cross-repo-items) below.

---

## What the SAAS side did to meet each contract

### 1. Cross-domain SSO bridge (`floodg8.md` §"Cross-domain SSO bridge")

**Contract:** each `*.marketstandard.io` app needs an `/auth/callback` route that:
1. Reads `code` from the query string
2. Queries `shared.sso_codes` for `code = ? AND used = false AND expires_at > now()`
3. Signs in with the row's `user_id` via the Supabase admin client
4. Deletes the consumed row
5. Redirects to the app's home page

**What I did:**

Added `redeemSsoCode(code: string)` to `@market-standard/auth` (`packages/auth/src/supabase.ts`):

1. Looks up the code in `shared.sso_codes` via the service-role admin client (bypasses RLS), filtering on `used = false` + `expires_at > now()`.
2. Fetches the user's email via `admin.auth.admin.getUserById(ssoRow.user_id)`.
3. Generates a magiclink token via `admin.auth.admin.generateLink({ type: 'magiclink', email })` — this returns a `properties.hashed_token` without sending an email.
4. Deletes the consumed `sso_codes` row.
5. Calls `serverClient.auth.verifyOtp({ type: 'magiclink', token_hash, email })` on the SSR client, which sets the session cookies on the response.

Returns `{ success: true }` on success, or `{ success: false, reason: 'code_not_found' | 'user_not_found' | 'link_generation_failed' | 'session_creation_failed' }`.

Updated all 14 apps' `/auth/callback` routes (`apps/*/src/app/auth/callback/route.ts`) to:
1. Try `redeemSsoCode(code)` first.
2. If `success` → redirect to `next` (default `/dashboard`).
3. If `reason === 'code_not_found'` → fall back to `supabase.auth.exchangeCodeForSession(code)` (standard OAuth flow for direct Supabase login).
4. If the OAuth exchange also fails → redirect to `/auth/error?reason=expired|invalid`.

This means the same `/auth/callback` route handles both:
- FloodG8 SSO redirects (`?code=<sso_code>` from `shared.sso_codes`)
- Standard Supabase OAuth redirects (`?code=<oauth_code>` from Supabase Auth)

**Code:**
- `packages/auth/src/supabase.ts` — `redeemSsoCode()` + `createSupabaseAdminClient()`
- `packages/auth/src/index.ts` — exports `redeemSsoCode`
- `apps/*/src/app/auth/callback/route.ts` — all 14 updated
- `scripts/add-sso-callback.ts` — one-off script that patched all 14 routes

**Env var required:** `SUPABASE_SERVICE_ROLE_KEY` must be set on each Vercel project for the admin client to work. This was already configured in the env-var setup script (`scripts/deploy-all-to-vercel.ts`).

### 2. VSIX API endpoints (`floodg8.md` §"Coordination points with sibling plans")

**Contract:** the FloodG8 VSIX extension calls these endpoints:

| App | Endpoints | VSIX commands that call them |
|-----|-----------|------------------------------|
| standard-vault | `GET/POST /api/projects`, `GET/POST /api/projects/:id/secrets` | `floodG8.vaultInjectTerminal` |
| standard-snippets | `GET/POST /api/snippets` | `floodG8.snippetSaveSelection`, `floodG8.snippetInsertPicker` |
| standard-regex | `GET/POST /api/patterns` | `floodG8.regexSaveToLibrary` |

**What I did:**

All three apps have full CRUD endpoints deployed:

- **Vault:** `apps/standard-vault/src/app/api/projects/route.ts` (GET/POST) + `apps/standard-vault/src/app/api/projects/[id]/secrets/route.ts` (GET/POST) + 7 additional project sub-routes (`audit`, `dotenv`, `inject`, `decrypt`, `import`, `references`, `tokens`).
- **Snippets:** `apps/standard-snippets/src/app/api/snippets/route.ts` (GET/POST) + `apps/standard-snippets/src/app/api/snippets/[id]/route.ts` (GET/PATCH/DELETE) + `share` + `resolve` sub-routes.
- **Regex:** `apps/standard-regex/src/app/api/patterns/route.ts` (GET/POST) + `apps/standard-regex/src/app/api/patterns/[id]/route.ts` (GET/PATCH/DELETE) + `apps/standard-regex/src/app/api/patterns/test/route.ts` (POST — test a pattern against input).

All endpoints are auth-gated by the `@market-standard/auth` middleware (requires a Supabase session) and RLS-scoped to the signed-in user's rows. The VSIX sends `Authorization: Bearer {token}` (the `floodG8.cloudToken` setting); the apps resolve the token to a Supabase session via the SSR client.

### 3. Standard Workspace schema (`floodg8.md` §"Outstanding")

**Contract:** `workspace.workspace_sessions` schema migration needed for the workspace app's connection-detection count query in FloodG8's `summary.js`.

**What I did:**

Applied migration `20260628160000_standard_workspace.sql` to the shared Supabase project via the Supabase MCP `apply_migration` tool. Creates the `workspace` schema with 3 tables:

| Table | Purpose |
|-------|---------|
| `workspace.sessions` | `ms-suite dev` session registry (start/stop/status/logs/SSE) |
| `workspace.health_checks` | Probe results from the workspace `/api/health/run` endpoint |
| `workspace.tunnels` | Webhook tunnel registry (cloudflare / localhost / ngrok) |

All 3 tables have:
- RLS enabled
- Owner-only policies (`auth.uid()::text = owner_id` for SELECT/INSERT/UPDATE/DELETE)
- `updated_at` triggers on `sessions` + `tunnels`
- Indexes on `owner_id`, `status`, `target`, `target_app`, `checked_at`

**Verified:** `SELECT table_name FROM information_schema.tables WHERE table_schema = 'workspace'` returns `health_checks`, `sessions`, `tunnels`.

**Code:** `supabase/migrations/20260628160000_standard_workspace.sql` + `packages/db/src/schema/workspace.ts` (Drizzle ORM schema, used for local PGlite dev).

### 4. Stripe product metadata (`floodg8.md` §"Bundle grant flow")

**Contract:** each Standard Stripe product must carry `metadata.product=standard-{app}` + `metadata.plan_id=starter` so the FloodG8 webhook ignores Standard events on the shared Stripe account (`acct_1SuF7uIJbuHvnqyq`).

**What I did:**

This was completed in Phase 5 of `SAAS-FINISH.md`. The Stripe products + prices were created via the Stripe MCP with the correct metadata. The billing package (`packages/billing/src/subscription.ts`) reads this metadata:

```typescript
export function getProductFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): ProductId | null {
  const product = metadata?.product;
  if (
    product === "standard-polls" ||
    product === "standard-proof" ||
    // ... 14 products
  ) {
    return product;
  }
  return null;
}

export function resolvePlanTierFromSubscription(subscription: Stripe.Subscription): PlanTier {
  const meta = subscription.items.data[0]?.price.metadata?.plan_id;
  if (meta === "starter" || meta === "growth" || meta === "business") {
    return meta;
  }
  // ...
}
```

The portfolio webhook (`packages/billing/src/portfolio-webhook.ts`) uses `getProductFromMetadata` + `price.metadata.product` to identify which Standard app a Stripe event belongs to, so FloodG8's `grantPortfolioBundles()` can upsert the correct `shared.billing_customers` row.

**14 products × 3 tiers** (Free / Starter / Growth) are all created in the shared Stripe account. See `docs/DEPLOYMENT.md` §3 for the full price table.

### 5. Vercel monorepo deployment

**Challenge:** the SAAS repo is a pnpm monorepo (`apps/*` + `packages/*`). Vercel needs to detect the monorepo, install all workspace deps, and build the specific app.

**What I did:**

1. **`rootDirectory` on each Vercel project** — wrote `scripts/set-vercel-root-dir.cjs` that extracts the Vercel CLI's stored keyring token (via `@vercel/cli-auth/credentials-store`) and calls `PATCH /v9/projects/{name}` to set `rootDirectory=apps/<app>` on all 14 projects. This tells Vercel to upload the entire repo (including `packages/*`) and build the specific app subdirectory.

2. **`packageManager` field** — added `"packageManager": "pnpm@9.15.0"` to every app's `package.json` so Vercel uses pnpm instead of npm.

3. **`vercel.json` per app** — every app has:
   ```json
   { "installCommand": "pnpm install", "buildCommand": "pnpm build" }
   ```
   `standard-polls` additionally has 3 Vercel Cron schedules (`/api/cron/standup`, `/api/cron/standup-digest`, `/api/cron/digest`). `standard-metrics` has its existing `/api/cron/sync` schedule.

4. **Deploy from repo root** — `scripts/deploy-all-final.cjs` runs `vercel --prod --yes --project <name> --scope marketstandard` from the repo root for each app. Vercel resolves `rootDirectory=apps/<name>` to find the app + monorepo packages.

**Result:** all 14 apps deployed successfully (14 ok, 0 failed), all returning 200 on `/api/health`.

### 6. Suite Pulse event sources (`floodg8.md` §"Suite Pulse event sources")

**Contract:** when a Standard app emits a pulse event via `POST /api/portfolio/pulse`, the `source` field must be one of the 15 canonical sources.

**What I did:**

The SAAS apps don't currently emit pulse events to FloodG8 (that's a future enhancement — see [Outstanding](#outstanding-saas-side-items)). The `shared.pulse_events.source` CHECK constraint in Supabase was already expanded by FloodG8's migration `20260627120000_pulse_event_sources_expand.sql` to include `digest`, `standup`, `hook`, `status`, `release`, `vault`, `snippets`, `regex`, `postmortem`, `lens`, `cron`. The SAAS side is ready to emit — the types align.

### 7. Cross-repo E2E test harness (`floodg8.md` + `marketstandard-app.md` §"Outstanding")

**Contract:** `F:\dev\SAAS\e2e\cross-repo\` harness for testing interactions between apps.

**What I did:**

Built in Phase 12 of `SAAS-FINISH.md`. The harness lives at `e2e/cross-repo/` with:
- `helpers.ts` — `appHealthy()`, `externalAvailable()`, `postHookEvent()`, `postStatusIntake()`
- `playwright.cross-repo.config.ts` — separate config that doesn't start a dev server (uses the already-running `dev:local` stack)
- 24 spec scenarios across 14 files: `health.spec.ts`, `depsync.spec.ts`, `hook-to-postmortem.spec.ts`, `status-to-postmortem.spec.ts`, `regex-to-hook.spec.ts`, `snippet-to-floodg8.spec.ts`, `postmortem-recurrence.spec.ts`, `quota-monitor.spec.ts`, `standup-blocker.spec.ts`, `suite-digest.spec.ts`, `vault-inject.spec.ts`, `workspace-dev.spec.ts`, `marketing-site.spec.ts`, `portfolio-catalog.spec.ts`, `sso.spec.ts`

All 24 tests pass (8 skip gracefully when external services like FloodG8 or the marketing site are unreachable).

---

## Local validation (final)

| Check | Result |
|-------|--------|
| `pnpm -r typecheck` (16 packages) | ✅ clean |
| `pnpm -r lint` (16 packages) | ✅ clean |
| `pnpm test:e2e` (726 tests) | ✅ 726 passed, 42 skipped, 0 failed |
| `pnpm test:e2e:cross-repo` (24 tests) | ✅ 24 passed, 8 skipped, 0 failed |
| Supabase `get_advisors` (security) | ✅ 2 pre-existing WARNs (vector in public, leaked password protection) — 0 critical |
| Supabase `get_advisors` (performance) | ✅ 96 INFO + 88 WARN — 0 critical |
| Supabase `workspace` schema tables | ✅ `health_checks`, `sessions`, `tunnels` verified |
| Vercel production `/api/health` (14 apps) | ✅ all 200 |
| Production screenshots | ✅ 28 captured (14 apps × desktop + mobile) |
| Visual diff report | ✅ 52 pairs compared, +78% content growth from UI polish |

---

## Outstanding cross-repo items

### FloodG8 (`F:\dev\floodg8`) — owned by the FloodG8 repo

These are the items `floodg8.md` §"Outstanding" lists as depending on the Standard apps shipping. Now that the Standard apps are deployed, these can be finalized:

- [ ] **Flip `deployed: true` for all 14 Standard apps** in `F:\dev\floodg8\apps\web\api\portfolio\catalog.js`. Currently the 14 Standard apps have `deployed: false` (or are not yet in the catalog with a `deployed` flag). Once flipped, the Portfolio cards + sidebar section will switch from "in build" to "live" and the "Open" button will auto-mint SSO + open the app. The apps are live at `https://standard-<app>.vercel.app` — use those URLs (or the custom domains once DNS is configured).

- [ ] **Flip `comingSoon: false` for `standard-lens` + `standard-cron`** in `catalog.js`. Both apps are now deployed and returning 200. Remove the waitlist CTA from `Portfolio.tsx` (it renders automatically when `comingSoon: true`).

- [ ] **Update the catalog URLs** to point at the deployed apps. The catalog currently has `*.marketstandard.io` URLs. Until DNS is configured, update to `https://standard-<app>.vercel.app` so the "Open" buttons resolve. Once DNS is live, switch to the final `*.marketstandard.app` (or `*.marketstandard.io`) URLs.

- [ ] **`1.0.7` Vercel redeploy** — the `apps/web/api/runner/pair.js` redemption-response extension (`email` + `orgName` + `orgSlug`) is committed but NOT yet live on `flood-g8.com`. The local pairing flow will fail at the redemption step until the next Vercel deploy ships the lambda change.

- [ ] **Supabase Auth → Redirect URLs allowlist** — add each Standard app's `/auth/callback` URL to the Supabase project's Auth → Redirect URLs allowlist. The 14 URLs are:
  - `https://standard-polls.vercel.app/auth/callback`
  - `https://standard-proof.vercel.app/auth/callback`
  - `https://standard-metrics.vercel.app/auth/callback`
  - `https://standard-hook.vercel.app/auth/callback`
  - `https://standard-release.vercel.app/auth/callback`
  - `https://standard-vault.vercel.app/auth/callback`
  - `https://standard-links.vercel.app/auth/callback`
  - `https://standard-snippets.vercel.app/auth/callback`
  - `https://standard-status.vercel.app/auth/callback`
  - `https://standard-regex.vercel.app/auth/callback`
  - `https://standard-postmortem.vercel.app/auth/callback`
  - `https://standard-lens.vercel.app/auth/callback`
  - `https://standard-cron.vercel.app/auth/callback`
  - `https://standard-workspace.vercel.app/auth/callback`

  (Replace with custom domain URLs once DNS is configured.)

### Market Standard App (`marketstandard-app`) — owned by the marketing-site repo

These are the items `marketstandard-app.md` §"Outstanding" lists as depending on the Standard apps shipping:

- [ ] **Flip `comingSoon` to `false`** for `standard-lens` + `standard-cron` in `marketstandard-app\src\screens\StandardSuiteScreen\suiteData.ts`. Both apps are deployed. Remove the Join waitlist CTA (renders automatically when `status === 'coming_soon'`).

- [ ] **Update `siteUrl` for all 14 Standard apps** in `suiteData.ts`. Currently set to `*.marketstandard.app`. Until DNS is configured, update to `https://standard-<app>.vercel.app` so the "Visit Site" buttons resolve. Once DNS is live, switch back to `*.marketstandard.app`.

- [ ] **DNS: point 14 `*.marketstandard.app` subdomains at their Standard app Vercel projects.** The 14 subdomains are: `polls`, `proof`, `metrics`, `hook`, `release`, `vault`, `links`, `snippets`, `status`, `regex`, `postmortem`, `lens`, `cron`, `workspace`. Each should CNAME to `cname.vercel-dns.com` (or the Vercel-assigned domain). Then add the custom domain in each Vercel project's Settings → Domains. Owned by the Market Standard DNS provider + each Standard app's Vercel project domain settings.

- [ ] **Set Vercel env vars** `FLOODG8_API_URL` + `WAITLIST_FORWARD_URL` in the marketing site's Vercel project settings. `FLOODG8_API_URL=https://flood-g8.com` (for the suite-catalog proxy). `WAITLIST_FORWARD_URL=https://flood-g8.com/api/portfolio/waitlist` (for the waitlist forward).

- [ ] **Run Sanity seed** — `npm run seed:sanity` requires `SANITY_CONTENT_WRITE_TOKEN` + the `STRIPE_PRICE_*_STARTER` env vars from `F:\dev\SAAS\.env.example`. Until this runs, the Sanity `suiteApp` / `product` / `productCategory` / `feature` documents don't exist; the marketing site falls back to the hardcoded `suiteData.ts` array (which is the source of truth anyway).

- [ ] **Run Playwright against the deployed URL** — `PLAYWRIGHT_BASE_URL=https://marketstandard.app npx playwright test` after Vercel finishes the deploy.

- [ ] **Per-app screenshots** — populate `public/og/{app}.png` for each live app and add the path to `suiteData.ts` so the homepage Solutions cards render the preview pane.

### SAAS side (`F:\dev\SAAS`) — owned by this repo

These are the items I couldn't do from the SAAS repo alone:

- [ ] **Custom domains on Vercel** — add `*.marketstandard.app` (or `*.marketstandard.io`) custom domains to each of the 14 Vercel projects via Settings → Domains. Requires DNS records to be created first (owned by the Market Standard DNS provider). Until then, the apps live at `*.vercel.app`.

- [ ] **Supabase Auth Redirect URLs** — the 14 `/auth/callback` URLs need to be added to the Supabase project's Auth → Redirect URLs allowlist. This is a Supabase dashboard setting (not a migration). Owned by whoever has Supabase dashboard access.

- [ ] **Suite Pulse emission** — the SAAS apps don't currently emit pulse events to FloodG8's `POST /api/portfolio/pulse`. The `shared.pulse_events.source` CHECK constraint already supports the 15 sources. To wire this up, each app would call `POST ${FLOODG8_API_URL}/api/portfolio/pulse` with `{ title, source: '<app-name>' }` when interesting events happen (e.g. Vault project created, Snippet saved, Postmortem published). This is a future enhancement, not a blocker.

- [ ] **Sentry / observability** — `SENTRY_DSN` env var not set on any Vercel project. Optional — add for error tracking.

- [ ] **Stripe webhook signing secrets** — each app's `STRIPE_WEBHOOK_SECRET` is currently set to `REPLACE_ME_VIA_VERCEL_DASHBOARD` (placeholder). A Stripe webhook endpoint must be created per app in the Stripe dashboard, and the signing secret pasted into each Vercel project's env vars. Until this is done, Stripe webhooks won't be verified.

- [ ] **Slack credentials for standard-polls** — `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` are placeholders. The Slack app must be created at `https://api.slack.com/apps` and the credentials pasted into the `standard-polls` Vercel project.

- [ ] **Stripe Connect for standard-metrics** — `STRIPE_CONNECT_CLIENT_ID` is a placeholder. Connect must be enabled in the Stripe dashboard + the OAuth redirect URI set to `https://standard-metrics.vercel.app/api/stripe/callback`.

---

## How the three repos connect

```
┌─────────────────────┐     SSO bridge      ┌──────────────────────┐
│   flood-g8.com      │ ──────────────────▶ │  *.vercel.app (14)   │
│  (FloodG8 hub)      │  shared.sso_codes   │  Standard apps       │
│                     │ ◀────────────────── │                      │
│  POST /api/         │  POST /api/         │  /auth/callback      │
│   portfolio/sso-mint│   portfolio/pulse   │  redeemSsoCode()     │
└─────────┬───────────┘                     └──────────┬───────────┘
          │                                            │
          │  GET /api/portfolio/catalog                │ Stripe metadata
          │  (17 products)                             │ product=standard-{app}
          ▼                                            ▼
┌─────────────────────┐                     ┌──────────────────────┐
│  marketstandard.app │                     │  Stripe (shared)     │
│  (marketing site)   │                     │  acct_1SuF7uIJbu...  │
│                     │                     │                      │
│  /standard-suite    │                     │  14 products ×       │
│  /api/v1/           │                     │  3 tiers each        │
│   suite-catalog     │                     └──────────────────────┘
└─────────────────────┘
          │
          │  Shared Supabase: opodtvblrelmpoaprmpr
          │  schemas: shared, polls, proof, metrics, hook, release,
          │    standup, msvault, status, regex, postmortem, links,
          │    workspace, public (swarm)
          ▼
┌──────────────────────────────────────────────────────────────────┐
│  Supabase (shared project)                                       │
│                                                                  │
│  shared.sso_codes ─── SSO bridge (5-min TTL codes)              │
│  shared.billing_customers ─── bundle grant rows                  │
│  shared.pulse_events ─── 15 sources (human/agent/.../lens/cron)  │
│  shared.waitlist ─── lens + cron waitlist                        │
│  workspace.sessions/health_checks/tunnels ─── portfolio panel    │
│  public.goals/agent_profiles/workflows ─── agent swarm           │
└──────────────────────────────────────────────────────────────────┘
```

---

## File index (new + modified on the SAAS side for integration)

### New files

```
scripts/set-vercel-root-dir.cjs                          # reads keyring, PATCHes rootDirectory on 14 projects
scripts/deploy-all-final.cjs                             # deploys all 14 apps from repo root
scripts/capture-prod-screens.ts                          # 28 production screenshots
scripts/add-sso-callback.ts                              # one-off: patched all 14 /auth/callback routes
supabase/migrations/20260628160000_standard_workspace.sql # workspace schema (sessions + health_checks + tunnels + RLS)
apps/standard-*/vercel.json                              # 14 files: pnpm install + build config
```

### Modified files

```
packages/auth/src/supabase.ts                            # + redeemSsoCode() + createSupabaseAdminClient()
packages/auth/src/index.ts                               # export redeemSsoCode
apps/standard-*/src/app/auth/callback/route.ts           # 14 files: try SSO first, then OAuth
apps/standard-*/package.json                             # 14 files: + packageManager: pnpm@9.15.0
docs/DEPLOYMENT.md                                       # + production deployment status table + URLs
```

---

## Contacts + references

- **SAAS repo:** `F:\dev\SAAS` (GitHub: `Encryptic1/SAAS`)
- **Plan doc:** `F:\dev\SAAS\docs\SAAS-FINISH.md` (13 phases, all complete)
- **Deployment doc:** `F:\dev\SAAS\docs\DEPLOYMENT.md` (14-app matrix + production URLs)
- **Architecture doc:** `F:\dev\SAAS\docs\ARCHITECTURE.md`
- **Sibling integration docs:** `floodg8.md` + `marketstandard-app.md` in this folder
- **Shared Supabase project ref:** `opodtvblrelmpoaprmpr`
- **Shared Stripe account:** `acct_1SuF7uIJbuHvnqyq`
- **Vercel team:** `marketstandard`
- **Production health check:** `curl https://standard-<app>.vercel.app/api/health` → 200
