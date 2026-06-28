# FloodG8 Integration — Market Standard SAAS Suite

**Date:** 2026-06-28
**Repo:** `F:\dev\floodg8` (commit `d666fd5` + `6dc3cec` + `fda73a9` swarm rework + `1.0.7` local↔cloud pairing, pushed to `origin/main`)
**Vercel deployment:** `dpl_ACbynrbPxt79CU51tmYDxt6hGW3L` — READY, aliased to `flood-g8.com` + `www.flood-g8.com` (the `1.0.7` `/api/runner/pair` lambda change is in the repo; live after the next Vercel deploy)
**Supabase project:** `opodtvblrelmpoaprmpr` (shared with all Standard apps)
**Plan reference:** `F:\dev\floodg8\docs\SAAS_SUITE_INTEGRATION.md` (phases 3–13) + `F:\dev\floodg8\docs\SWARM.md` (agent swarm layer)

This file documents what the FloodG8 side of the SAAS suite integration did, so the parallel `SAAS-FINISH.md` plan in `F:\dev\SAAS\docs\` and the marketing site plan in `marketstandard-app\docs\` can coordinate against it.

---

## TL;DR

FloodG8 is now the unified front door for **17 products**: 13 Standard apps + FloodG8 + SyncDevTime + Agent Skill + Standard Workspace. All 13 phases of `SAAS_SUITE_INTEGRATION.md` are complete, validated, and live on `flood-g8.com`. The FloodG8 side is production-ready; the remaining work (lens + cron + workspace app builds + cross-repo integration test harness) is owned by the sibling `SAAS-FINISH.md` plan.

A parallel **agent swarm rework** (commit `fda73a9`, see `F:\dev\floodg8\docs\SWARM.md`) added row-bot's Goal Mode, Agent Profiles, child-agent delegation, an LLM-backed planner, Workflows, and Skills over the existing release pipeline — no existing surface removed. New cloud lambdas + Supabase tables for `goals` / `agent_profiles` / `workflows` / `workflow_runs` are listed below.

A **`1.0.7` local↔cloud pairing** follow-up lets the VSIX local dash (the `localhost:8911` web app the extension serves) link to a `flood-g8.com` account via an 8-char code minted on the cloud `/pair` page. The local server redeems the code against the existing cloud `/api/runner/pair` lambda, stores the resulting identity (`email`, `orgName`, `runnerId`) in a new local SQLite `cloud_pairings` table, and the local dash sidebar renders "Linked to FloodG8 Cloud · {email} · {org}". No Supabase keys are baked into the VSIX bundle; the pairing code is the credential. Details in the [Local dash ↔ cloud pairing (1.0.7)](#local-dash--cloud-pairing-107) section below.

---

## Catalog (single source of truth)

The 17-product catalog lives at:

- **Code:** `F:\dev\floodg8\apps\web\api\portfolio\catalog.js`
- **Public endpoint:** `GET https://www.flood-g8.com/api/portfolio/catalog`
- **CORS:** allowed from `*.marketstandard.io`, `*.marketstandard.app`, `flood-g8.com`, `*.vercel.app`, `http://localhost:*`
- **Verified response:** `{ count: 17, products: [...] }`

Each product entry has: `id`, `name`, `tagline`, `kind` (`web` | `cli`), `accent` (`flood` | `gilt`), `icon`, `section`, `url`, `plan`, `comingSoon`, `billingSource`, `docs`.

| id | name | kind | comingSoon | URL |
| --- | --- | --- | --- | --- |
| `standard-polls` | Standard Polls | web | — | <https://polls.marketstandard.io> |
| `standard-proof` | Standard Proof | web | — | <https://proof.marketstandard.io> |
| `standard-metrics` | Standard Metrics | web | — | <https://metrics.marketstandard.io> |
| `standard-hook` | Standard Hook | web | — | <https://hook.marketstandard.io> |
| `standard-release` | Standard Release | web | — | <https://release.marketstandard.io> |
| `standard-links` | Standard Links | web | — | <https://links.marketstandard.io> |
| `standard-vault` | Standard Vault | web | — | <https://vault.marketstandard.io> |
| `standard-snippets` | Standard Snippets | web | — | <https://snippets.marketstandard.io> |
| `standard-status` | Standard Status | web | — | <https://status.marketstandard.io> |
| `standard-regex` | Standard Regex | web | — | <https://regex.marketstandard.io> |
| `standard-postmortem` | Standard Postmortem | web | — | <https://postmortem.marketstandard.io> |
| `standard-lens` | Standard Lens | web | ✅ | <https://lens.marketstandard.io> |
| `standard-cron` | Standard Cron | web | ✅ | <https://cron.marketstandard.io> |
| `standard-workspace` | Standard Workspace | web | — | <https://workspace.marketstandard.io> |
| `syncdevtime` | SyncDevTime | web | — | <https://www.syncdevtime.com> |
| `floodg8` | FloodG8 | web | — | <https://flood-g8.com> |
| `ms-agent-skill` | Agent Skill Pack | cli | — | <https://www.npmjs.com/package/@marketstandard/agent-skill> |

For local development, `FLOODG8_ENV=local` flips all `*.marketstandard.io` URLs to `http://localhost:30xx` (one port per app). The port map lives in `F:\dev\floodg8\packages\shared\src\suite-urls.ts`.

---

## API endpoints added on FloodG8

All under `https://www.flood-g8.com/api/...`. Auth-required endpoints accept `Authorization: Bearer {supabase_access_token}`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/portfolio/catalog` | no | 17-product catalog (CORS-allowed from `*.marketstandard.io`) |
| GET | `/api/portfolio/summary` | yes | Catalog + per-user `connected`/`entitled`/`comingSoon` flags |
| GET | `/api/portfolio/pulse?limit=25` | yes | Suite Pulse activity feed |
| POST | `/api/portfolio/pulse` | yes | Append a pulse event (`{ title, source }`) |
| POST | `/api/portfolio/agent-report` | yes | Ingest an agent report from `ms-agent` CLI |
| GET | `/api/portfolio/agent-cost?days=7` | yes | Aggregated cost for one agent |
| GET | `/api/portfolio/agent-costs?days=30` | yes | Aggregated cost across all agents |
| GET | `/api/portfolio/agent-health?days=7` | yes | Agent health summary (running/completed/failed) |
| GET | `/api/portfolio/agent-skill-version` | no | Latest `@marketstandard/agent-skill` version + connection status |
| POST | `/api/portfolio/sso-mint` | yes | Mint a short-lived SSO code for cross-domain sign-in |
| GET | `/api/portfolio/sso-mint?targetApp=...` | yes | Same, via GET for redirect-based flows |
| POST | `/api/portfolio/sign-out-everywhere` | yes | Revoke all unused `shared.sso_codes` for the user |
| GET | `/api/portfolio/waitlist` | yes | List the user's waitlist entries |
| POST | `/api/portfolio/waitlist` | yes | Join the waitlist for a coming-soon product (lens/cron only) |
| GET | `/api/runs/summary?days=7` | yes | Aggregated FloodG8 run stats (total/completed/failed by day) |
| GET | `/api/integrations/syncdevtime/summary?days=7` | yes | Real aggregated SyncDevTime heartbeats (queries the SyncDevTime Supabase project via bridge) |
| GET | `/api/goals` | yes | List the signed-in user's org swarm goals (cloud CRUD mirror; local runner stays the execution source of truth) |
| POST | `/api/goals` | yes | Create a goal |
| GET | `/api/profiles` | yes | List the signed-in user's org agent profiles (built-ins are seeded locally by the runner; cloud stores org overrides) |
| POST | `/api/profiles` | yes | Create a profile |
| GET | `/api/workflows` | yes | List the signed-in user's org workflows (execution stays on the paired local runner; cloud stores the definition) |
| POST | `/api/workflows` | yes | Create a workflow |
| POST | `/api/workflows/:id/tick` | yes | Manual workflow fire — records a `workflow_runs` row in `queued` state. The paired local runner picks it up via cloud-relay + executes the steps. Returns 202 Accepted. (If no runner is paired, the tick sits queued until one connects.) |
| POST | `/api/runner/pair` | yes | Mint an 8-char pairing code (10-min TTL) for the signed-in user's org. Called by the cloud `/pair` page. |
| GET | `/api/runner/pair?code=…` | no | Poll pairing status (the local server uses this to look up a code before redeeming). |
| POST | `/api/runner/pair?code=…` | no | Redeem a pairing code. Called by the **local** VSIX server (`POST /api/cloud/pair` proxies here) with `{ deviceFingerprint, allowedRoots }`. Upserts a `runner_devices` row, marks the pairing `redeemed`, and returns `{ runnerId, runnerName, orgId, orgName, orgSlug, email, relayChannel }`. The `email` + `orgName` fields were added in `1.0.7` so the local dash can render "Linked to FloodG8 Cloud · {email} · {org}". **No tokens are returned** — the local dash gets display identity only; the cloud relay's Supabase auth still comes from the runner's env. |

### Local-runner endpoints (VSIX `localhost:8911`, not on Vercel)

These live on the local Fastify server bundled into the VSIX — they are NOT deployed to `flood-g8.com`. The web SPA calls same-origin `/api/cloud/*` which the local server handles.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/cloud/pair` | Current pairing state. Returns `{ paired: true, …CloudPairing }` or `{ paired: false, deviceFingerprint }`. |
| POST | `/api/cloud/pair` | Body `{ code }`. Validates the 8-char code, calls `POST {FLOODG8_CLOUD_URL}/api/runner/pair?code=…` with the stable `deviceFingerprint`, stores the result in the local `cloud_pairings` SQLite table, returns the pairing. |
| POST | `/api/cloud/unpair` | Clears the stored pairing (keeps the `deviceFingerprint` for re-pairing). |
| GET | `/api/runner/state` | Existing relay state (paired runnerId + channel). Unchanged. |

**Code location:** `F:\dev\floodg8\apps\web\api\portfolio\*.js` + `F:\dev\floodg8\apps\web\api\runs\summary.js` + `F:\dev\floodg8\apps\web\api\integrations\syncdevtime\summary.js` + `F:\dev\floodg8\apps\web\api\{goals,profiles,workflows}.js` + `F:\dev\floodg8\apps\web\api\workflows\[id]\tick.js` + `F:\dev\floodg8\apps\web\api\runner\pair.js` (cloud pairing lambda). Local pairing routes: `F:\dev\floodg8\packages\server\src\app.ts`.

---

## Supabase migrations applied

Project ref: `opodtvblrelmpoaprmpr`. All migrations applied via the Supabase MCP `apply_migration` tool.

| Migration | Schema | What it adds |
| --- | --- | --- |
| `20260627000000_market_standard_portfolio.sql` | `shared`, `proof`, `metrics`, `polls`, `links` | `sso_codes`, `billing_customers`, `pulse_events`, `agent_reports`, `agent_sessions`, `agent_costs`, `snippets`, `waitlist` (already existed — confirmed not re-applied) |
| `20260627005000_standard_vault.sql` | `msvault` | `projects`, `secrets` (already existed) |
| `20260627010000_suite_pulse_agent_observability.sql` | `shared` | Pulse + agent observability tables (already existed) |
| `20260627020000_standard_snippets.sql` | `shared` | `snippets` (already existed) |
| `20260627030000_standard_status.sql` | `status` | `pipelines` (already existed) |
| `20260627040000_standard_regex.sql` | `regex` | `patterns` (already existed) |
| `20260627050000_standard_postmortem.sql` | `postmortem` | `incidents` with inline `rootcause_embedding` + ivfflat index (pgvector already enabled — separate `recurrence_embeddings` table skipped as redundant) |
| `20260627060000_standard_links.sql` | `links` | **NEW** `link_records` + `link_click_events` with RLS |
| `20260627070000_metrics_quota_samples.sql` | `metrics` | **NEW** `quota_samples` with RLS |
| `20260627090000_standup_blocker_keywords.sql` | `standup` | **NEW** `blocker_keywords` with RLS |
| `20260627100000_shared_waitlist.sql` | `shared` | **NEW** `waitlist` with RLS + unique `(user_id, product)` |
| `20260627120000_pulse_event_sources_expand.sql` | `shared` | **NEW** Drops + re-adds `CHECK` constraint on `pulse_events.source` to allow the 11 new sources |
| `20260628120000_swarm.sql` | `public` | **NEW** `goals`, `agent_profiles`, `workflows`, `workflow_runs` tables with FK to `orgs` + RLS via `private.is_org_member(org_id)` + `private.has_org_role`. Mirrors the local swarm schema so the web dashboard can manage swarm state when no runner is paired. |

**Verification:** `list_migrations` confirms all 30 migrations applied. `execute_sql` confirms all 12 expected tables present in `links`, `metrics`, `standup`, `shared` schemas. `get_advisors` reports only 2 pre-existing WARNs (`extension_in_public` for vector, `auth_leaked_password_protection` disabled) — both documented in `SAAS_SUITE_INTEGRATION.md` §4.5 as accepted risks, not regressions.

---

## Cross-domain SSO bridge

**Problem:** FloodG8 lives on `flood-g8.com` while Standard apps live on `*.marketstandard.io`. Browsers don't share cookies across registrable domains.

**Solution:** `shared.sso_codes` — short-lived (5-minute) one-time codes minted by FloodG8 that the target app's `/auth/callback` exchanges for a Supabase session.

### Flow

1. User clicks "Open Standard Vault" on `flood-g8.com/portfolio`.
2. Frontend calls `POST /api/portfolio/sso-mint` with `{ targetApp: 'standard-vault' }`.
3. FloodG8 inserts a row into `shared.sso_codes` with `user_id`, `target_app`, `code` (random 32-char hex), `expires_at = now() + 5 minutes`.
4. FloodG8 returns `{ url: 'https://vault.marketstandard.io/auth/callback?code=...' }`.
5. Frontend redirects to that URL.
6. Standard Vault's `/auth/callback` reads `code` from the query string, queries `shared.sso_codes` for a matching row that hasn't expired + hasn't been used, then signs the user in via Supabase with the row's `user_id`.
7. Standard Vault deletes the consumed `sso_codes` row.

**Endpoints:**
- `POST /api/portfolio/sso-mint` (JSON body) — for SPA-initiated flows
- `GET /api/portfolio/sso-mint?targetApp=...` — for redirect-based flows
- `POST /api/portfolio/sign-out-everywhere` — revokes all unused + unexpired `sso_codes` for the user (propagates sign-out across the suite)

**Code:** `F:\dev\floodg8\apps\web\api\portfolio\sso-mint.js` + `F:\dev\floodg8\apps\web\api\portfolio\sign-out-everywhere.js`

**Supabase project config required:** add `https://vault.marketstandard.io/auth/callback`, `https://snippets.marketstandard.io/auth/callback`, etc. to the Supabase project's Auth → Redirect URLs allowlist (see `F:\dev\floodg8\docs\SAAS_SSO.md` for the full list).

**Standard app contract:** each `*.marketstandard.io` app needs an `/auth/callback` route that:
1. Reads `code` from the query string
2. Queries `shared.sso_codes` for `code = ? AND used = false AND expires_at > now()`
3. Signs in with the row's `user_id` via the Supabase admin client
4. Deletes the consumed row
5. Redirects to the app's home page

---

## Bundle grant flow

When a Floodgate Team or Enterprise subscription activates, the Stripe webhook calls `grantPortfolioBundles()` to upsert one row per Standard product into `shared.billing_customers`. Each row carries the `floodg8-bundle:{stripe_subscription_id}` marker so a cancelled FloodG8 sub only resets rows we issued — never a row the user paid for directly inside a Standard app.

**Code:** `F:\dev\floodg8\packages\billing\src\bundle-grant.ts` → `grantPortfolioBundles()` + `revokePortfolioBundles()`

**Bundle map** (13 keys → 13 products, all `plan: 'starter'`):

| Bundle key | Standard product |
| --- | --- |
| `standard-proof-starter` | `standard-proof` |
| `standard-metrics-starter` | `standard-metrics` |
| `standard-polls-starter` | `standard-polls` |
| `standard-hook-starter` | `standard-hook` |
| `standard-release-starter` | `standard-release` |
| `standard-links-starter` | `standard-links` |
| `standard-vault-starter` | `standard-vault` |
| `standard-lens-starter` | `standard-lens` |
| `standard-cron-starter` | `standard-cron` |
| `standard-snippets-starter` | `standard-snippets` |
| `standard-status-starter` | `standard-status` |
| `standard-regex-starter` | `standard-regex` |
| `standard-postmortem-starter` | `standard-postmortem` |

These bundle keys are added to `floodg8-team` and `floodg8-enterprise` plans in `F:\dev\floodg8\packages\shared\src\entitlements.ts`.

**Standard app webhook contract:** each Standard Stripe product must carry `metadata.product=standard-{app}` + `metadata.plan_id=starter` so the FloodG8 webhook ignores Standard events on the shared Stripe account (`acct_1SuF7uIJbuHvnqyq`). See `F:\dev\floodg8\docs\STRIPE_WEBHOOK_MOCK.md` for local testing with the Stripe CLI.

---

## Suite Pulse event sources

The `shared.pulse_events.source` column has a CHECK constraint that limits it to a canonical list. The list lives in `F:\dev\floodg8\packages\shared\src\pulse-event-types.ts` and is the single source of truth for both the API validation and the DB constraint.

**15 sources:**

```
human, agent, metrics, syncdevtime,        // original 4
digest, standup, hook, status, release,    // new suite sources
vault, snippets, regex, postmortem,        // new suite sources
lens, cron                                  // new suite sources
```

**Standard app contract:** when a Standard app emits a pulse event via `POST /api/portfolio/pulse`, the `source` field must be one of the above. The `ms-agent` CLI uses `source: 'agent'`; Standard Vault uses `source: 'vault'`; Standard Status uses `source: 'status'`; etc.

---

## VSIX extension commands (16 new)

All under the `Market Standard` category in the command palette.

### Open-standard deep links (9 commands)

| Command | Opens |
| --- | --- |
| `floodG8.openStandardVault` | <https://vault.marketstandard.io> |
| `floodG8.openStandardLinks` | <https://links.marketstandard.io> |
| `floodG8.openStandardSnippets` | <https://snippets.marketstandard.io> |
| `floodG8.openStandardStatus` | <https://status.marketstandard.io> |
| `floodG8.openStandardRegex` | <https://regex.marketstandard.io> |
| `floodG8.openStandardPostmortem` | <https://postmortem.marketstandard.io> |
| `floodG8.openStandardHook` | <https://hook.marketstandard.io> |
| `floodG8.openStandardRelease` | <https://release.marketstandard.io> |
| `floodG8.openStandardWorkspace` | <https://workspace.marketstandard.io> |

### Editor actions (5 commands, also in `editor/context` menu)

| Command | What it does |
| --- | --- |
| `floodG8.vaultInjectTerminal` | Pick a Standard Vault project → inject its secrets into the integrated terminal as env vars |
| `floodG8.snippetSaveSelection` | Save the active editor selection as a Standard Snippet (prompts for title + tags) |
| `floodG8.snippetInsertPicker` | Pick a saved snippet → insert at cursor |
| `floodG8.regexTestSelection` | Test the active selection against a regex pattern (prompts for pattern + flags) → renders HTML results |
| `floodG8.regexSaveToLibrary` | Save the active selection as a Standard Regex pattern (prompts for name + flags + description) |

### Suite commands (2 commands)

| Command | Opens |
| --- | --- |
| `floodG8.suiteHealth` | <https://flood-g8.com/portfolio> (Suite Health dashboard) |
| `floodG8.suiteDev` | <https://flood-g8.com/portfolio> (dev mode, same URL for now) |

**Code:** `F:\dev\floodg8\apps\extension\src\extension.ts` (handlers) + `F:\dev\floodg8\apps\extension\src\standard-api.ts` (typed API client) + `F:\dev\floodg8\apps\extension\package.json` (command declarations + `floodG8.cloudToken` config).

**Auth:** the extension reads the bearer token from `floodG8.cloudToken` (set via Settings → `floodG8.cloudToken`). The token is sent as `Authorization: Bearer {token}` on all Standard API calls.

**`1.0.7` change:** `floodG8.connect` ("Connect to FloodG8 Cloud") now opens `https://flood-g8.com/pair` (was `/settings?focus=heartbeat`) so the command maps directly to the local↔cloud pairing flow. The `floodG8.cloudToken` setting is unchanged + orthogonal — it's for Standard suite API auth, not for linking the local dash identity. See [Local dash ↔ cloud pairing (1.0.7)](#local-dash--cloud-pairing-107) below.

---

## URL resolution helper

`F:\dev\floodg8\packages\shared\src\suite-urls.ts` is the single source of truth for production + local-dev URLs.

```ts
import { suiteUrl, suiteBaseUrl, SUITE_APPS, isLocalEnv } from '@floodg8/shared';

suiteUrl('standard-vault', '/dashboard')
// → 'https://vault.marketstandard.io/dashboard' (production)
// → 'http://localhost:3006/dashboard'            (FLOODG8_ENV=local)
```

**Local port map:**

| App | Port |
| --- | --- |
| `standard-polls` | 3001 |
| `standard-proof` | 3002 |
| `standard-metrics` | 3003 |
| `standard-hook` | 3004 |
| `standard-release` | 3005 |
| `standard-vault` | 3006 |
| `standard-links` | 3007 |
| `standard-snippets` | 3008 |
| `standard-status` | 3009 |
| `standard-regex` | 3010 |
| `standard-postmortem` | 3011 |
| `standard-lens` | 3012 |
| `standard-cron` | 3013 |
| `standard-workspace` | 3014 |
| `floodg8` | 5173 |
| `syncdevtime` | (no local port — production only) |
| `ms-agent-skill` | (no local port — npm URL only) |

**Standard apps should use this helper too** if they need to deep-link to sibling apps (e.g. Standard Vault's "send to Standard Postmortem" button). Install `@floodg8/shared` as a dependency or copy the helper inline.

---

## Portfolio UI/UX

The Portfolio page at `https://flood-g8.com/portfolio` renders:

1. **Header** — title + SSO note ("SSO is enabled for your account — clicking any live app signs you in automatically" for Enterprise; otherwise "Upgrade to Enterprise for org-wide SSO")
2. **Get started banner** (onboarding) — shown when the user hasn't completed all 6 onboarding steps: sign in → get suite access → post a pulse → save a snippet → create a vault project → run an agent. Each step shows a ✓ when done.
3. **Suite Health header card** — 5 metrics: Products (total + live), Live (deployed + usable), Connected, Entitled, Plan (+ agent-skill version)
4. **Filter bar** — All / Connected / Entitled / Not connected
5. **Product grid** — 17 cards grouped into 4 sections (Daily Workflow, Engineering Insights, Incident Response, Platform). Each card shows: product icon, name, tagline, plan + billing source, **item count + last activity** (e.g. "3 items · 2h ago"), status chip (**live** / **connected** / **bundled** / **in build** / **coming soon**), and action buttons:
   - **Live + deployed** → "Open {app} →" button that **auto-mints an SSO code** via `POST /api/portfolio/sso-mint` + opens the app in a new tab (no second login)
   - **In build** (not yet deployed) → disabled "In build — coming soon" button + explainer ("This app is being built by the SAAS-FINISH track. Your bundle grant is reserved — it'll activate when the app goes live.")
   - **Coming soon** (lens/cron) → "Join waitlist" button (writes to `shared.waitlist`)
   - **CLI** (agent-skill) → "Install via npm →" link
6. **Suite Pulse** — recent activity feed with "Post a pulse update" input
7. **Agent Health panel** — running/completed/failed agent sessions
8. **AI Cost widget** — token spend across agents (7D / 30D / 90D toggle)
9. **Hybrid Standup Template** — auto-summarized agent activity + human focus → generated markdown for Slack/standup channel

**Code:** `F:\dev\floodg8\apps\web\src\pages\Portfolio.tsx` + `F:\dev\floodg8\apps\web\src\components\{AgentHealthPanel,AgentCostWidget,HybridStandupTemplate}.tsx`

**Screenshots:** 10 production Playwright screenshots captured + embedded in `F:\dev\floodg8\docs\SAAS_SUITE.md`. The unauth state renders sections 6–9 (always-rendered); sections 1–5 render once the user signs in.

---

## Onboarding + UX improvements (1.0.6)

After the initial 1.0.5 integration shipped, the user reported that logging into `flood-g8.com/portfolio` showed "nothing" — the cards rendered but felt empty because (a) the 11 Standard apps aren't deployed yet (HTTP 000), (b) the admin user had 0 rows of real data in every app, (c) the "Open" buttons were plain `<a href>` links to dead URLs, and (d) there was no onboarding to explain the flow. The 1.0.6 follow-up addresses this:

### 1. Honest app availability status (`deployed` flag)

Each catalog entry now carries a `deployed: boolean` flag. Currently:
- **Deployed (3):** `floodg8`, `syncdevtime`, `ms-agent-skill`
- **Not yet deployed (13):** all 11 Standard apps + `standard-workspace` + `standard-lens` + `standard-cron`

The Portfolio card renders one of 5 statuses honestly:
- `live` — deployed + not coming-soon (green)
- `connected` — deployed + user has data/billing (green)
- `bundled` — entitled via plan but not yet connected (default)
- `in build` — `deployed: false` + not coming-soon (grey) — "This app is being built by the SAAS-FINISH track"
- `coming soon` — `comingSoon: true` (gold) — waitlist CTA

When `deployed: false`, the "Open" button is disabled and replaced with "In build — coming soon". This stops users from clicking through to dead URLs.

**To flip an app to live:** set `deployed: true` in `F:\dev\floodg8\apps\web\api\portfolio\catalog.js` once the app is deployed. The card + sidebar update automatically.

### 2. Auto-mint SSO on click

The "Open {app}" button is no longer a plain `<a href>`. It's now a `<button>` that:
1. Calls `POST /api/portfolio/sso-mint` with `{ targetApp: product.id }` + the user's access token
2. Receives `{ url: 'https://{app}.marketstandard.io/auth/callback?code=...' }`
3. Opens that URL in a new tab via `window.open(url, '_blank', 'noreferrer')`

The button shows "Signing you in…" while the SSO code is being minted. If the user isn't authed, it falls back to opening the bare URL.

**Code:** `PortfolioCard` component in `Portfolio.tsx` + `SuiteSection` in `Shell.tsx`

### 3. Onboarding banner

When the user hasn't completed all 6 onboarding steps, a "Get started" banner renders above the Suite Health header. Steps:
1. Sign in to FloodG8 (auto-done)
2. Get suite access via Team/Enterprise plan (done when `shared.billing_customers` has rows)
3. Post your first Suite Pulse update (done when `shared.pulse_events` has a row)
4. Save a code snippet to Standard Snippets (done when `shared.snippets` has a row)
5. Create a Standard Vault project (done when `msvault.projects` has a row)
6. Run an agent + post a report via ms-agent CLI (done when `shared.agent_reports` has a row in the last 7 days)

Each step shows ✓ when done + a progress counter ("X of 6 steps complete"). The banner auto-hides once all 6 are done.

**Backend:** `/api/portfolio/summary` now returns an `onboarding: { showBanner, steps: [{ id, label, done }] }` object alongside the products array.

### 4. Left sidebar "Standard Suite" section

The FloodG8 desktop sidebar (`Shell.tsx`) now has a collapsible "Standard Suite" section below the main nav. It lists every Standard app (excluding `floodg8` which is already in the main nav, and `ms-agent-skill` which is a CLI) with a status dot:
- **green** = deployed + live
- **grey** = in build (not yet deployed)
- **gold** = coming soon (waitlist)

Clicking a **live** app auto-mints an SSO code + opens the app in a new tab (same as the Portfolio card). Clicking an **in build** or **coming soon** app navigates to `/portfolio` for the waitlist/explainer. A "View all in Portfolio →" link sits at the bottom.

The section header shows the live count: "Standard Suite · 1 live".

**Code:** `SuiteSection` component in `F:\dev\floodg8\apps\web\src\components\Shell.tsx`. Fetches the catalog via `api.portfolioCatalog` (react-query, 5min staleTime).

### 5. Per-card item counts + last activity

Each Portfolio card now shows a line like "3 items · 2h ago" or "last 5m ago" when the user has data in that app. This makes the Portfolio feel "real" instead of just a link directory.

**Backend:** `/api/portfolio/summary` now returns `itemCount` + `lastActivityAt` per product. Counts come from the same per-app table queries that powered the old `connected` boolean; `lastActivityAt` comes from new `ORDER BY created_at DESC LIMIT 1` queries on `snippets`, `msvault.projects`, `agent_reports`, + `pulse_events`.

### 6. Demo data seed for admin

To make the Portfolio show actual content for `admin@marketstandard.app`, a reproducible seed script inserts:
- 3 snippets (TypeScript SSO helper, SQL EXPLAIN one-liner, bash agent-report poster)
- 1 vault project ("[demo] FloodG8 Cloud")
- 3 pulse events (human onboarding, agent VSIX ship, snippets saved)
- 2 agent reports (Cursor + Claude Code)

**Seed script:** `F:\dev\floodg8\supabase\seed\seed-admin-demo.sql`
**Cleanup script:** `F:\dev\floodg8\supabase\seed\cleanup-admin-demo.sql`

Both are idempotent + use `[demo]` markers / fixed IDs so they only touch demo rows. Run via Supabase MCP `execute_sql` or `psql`.

### User journey (the flow this enables)

1. **Sign up** at `flood-g8.com` → Supabase auth creates the user.
2. **Land on Portfolio** → the "Get started" banner shows 6 steps with step 1 already ✓.
3. **Buy a Team/Enterprise plan** → Stripe webhook grants 13 `shared.billing_customers` rows → step 2 ✓ + all 13 Standard cards flip to "bundled".
4. **Post a pulse update** → step 3 ✓.
5. **Install the FloodG8 VSIX** from the Cursor/VS Code marketplace → `floodG8.cloudToken` setting → extension can call Standard APIs.
6. **Install the agent-skill CLI** → `npm i -g @marketstandard/agent-skill` → run an agent → posts a report to `/api/portfolio/agent-report` → step 6 ✓.
7. **Click "Open Standard Vault"** in the sidebar or Portfolio card → auto-mints SSO code → opens `vault.marketstandard.io/auth/callback?code=...` → Standard Vault signs them in + redirects to dashboard. (Once the app is deployed.)
8. **Until the Standard apps ship**, the cards show "in build" honestly + the bundle grant is reserved.

---

## Agent swarm layer (commit `fda73a9`, parallel to 1.0.6)

A rework of FloodG8's orchestration into a goal-driven agent swarm, inspired by [siddsachar/row-bot](https://github.com/siddsachar/row-bot). Sits **over** the existing Floodgate/Sluice/Spillway/Distiller loop — no portfolio / SSO / billing / VSIX surface removed. Full design + ponytail notes: `F:\dev\floodg8\docs\SWARM.md`.

### What it adds

- **Goal Mode** — persistent `Goal` entity (status `draft → active → done | blocked`, progress 0..1, blockers). `reduceGoal` folds distilled insights into progress + blockers.
- **Agent Profiles** — 4 built-ins (planner / researcher / implementer / reviewer) with system prompts, tool/channel allowlists, model overrides, `maxChildren`, `approvalMode`. `applyProfileToPlan` narrows a plan to the profile.
- **Child delegation** — `ChildDelegator` spawns child runs with `parentRunId` set + narrowed scope + tighter steer. Child runs are normal `runs` rows (no separate table).
- **LlmPlanner** — `Planner` impl that calls `compressedComplete()` (the headroom gate) with the compressed transcript + graphify slice. Falls back to `HeuristicPlanner` when no BYO key — the swarm still works on the free tier. `pnpm headroom:check` still passes.
- **SwarmOrchestrator** — `orchestrate({ goal, profile, repoRoot })` stacks a plan, opens the floodgate, wires distiller updates back to the goal.
- **Workflows** — cron (60s tick) + task-completion triggers that auto-open floods. Each step stacks a plan or opens a flood against a goal + profile.
- **Skills** — `*.md` from `<workspaceRoot>/skills/` with frontmatter; prepended to matched plan prompts. No SQL table (ponytail).
- **Slack approval routing** — `packages/server/src/notify/` posts approvals to Slack when `SLACK_BOT_TOKEN` + `SLACK_APPROVAL_CHANNEL` are set. Notification-only MVP (dashboard does inline resolve); Socket Mode is the upgrade path.

### Cloud surfaces (visible to `*.marketstandard.io` siblings)

| Surface | Where |
| --- | --- |
| Vercel lambdas | `apps/web/api/{goals,profiles,workflows}.js` + `apps/web/api/workflows/[id]/tick.js` — cloud CRUD mirrors so the web dashboard can manage swarm state when no runner is paired. The local runner stays the execution plane. |
| Supabase tables | `public.goals`, `public.agent_profiles`, `public.workflows`, `public.workflow_runs` — migration `20260628120000_swarm.sql`, RLS via `private.is_org_member(org_id)`. |
| Dashboard pages | `apps/web/src/pages/{Goals,Profiles,Workflows,Skills}.tsx` — new. `Floodgate.tsx` gains "Orchestrate a goal" mode; `Reservoir.tsx` shows goal linkage; `Tributary.tsx` renders the child-run tree; `Approvals.tsx` shows the Slack hint. |
| Cloud-relay events | `cloud-relay-publisher.ts` forwards the curated swarm subset (`goal.updated`, `profile.applied`, `child.delegated`, `workflow.triggered`, `workflow.step.completed`, `workflow.updated`, `skill.created`) to the `runner:<id>` Realtime channel. Filesystem paths + raw stdout never leave the runner. |

### Local-only (NOT on Vercel — runner execution plane)

The orchestrator + workflow tick fire + channels run on the paired local runner only (SQLite + cursor-cdp + git worktrees aren't available in the cloud lambda environment). The `/api/workflows/:id/tick` lambda is a deliberate stub: it records a `queued` `workflow_runs` row + the paired runner picks it up via cloud-relay. Ceiling: if no runner is paired, the tick sits queued. Upgrade path: a cloud-side orchestrator adapter (documented in `docs/SWARM.md` ponytail notes).

### Validation (commit `fda73a9`)

| Check | Result |
| --- | --- |
| `pnpm typecheck` (22 packages) | ✅ clean |
| `pnpm test` (incl. 6 new swarm self-checks) | ✅ all green |
| `pnpm headroom:check` | ✅ ok (no ungated provider imports) |

---

## Local dash ↔ cloud pairing (`1.0.7`)

The VSIX extension bundles a local Fastify server (`@floodg8/server`) that serves the same web SPA at `http://127.0.0.1:8911` that `flood-g8.com` serves on Vercel. Before `1.0.7` the local dash had no account concept — `Login.tsx` rendered "FloodG8 cloud is not configured in this environment. The local VSIX runner does not require an account." and the sidebar showed no identity. The `1.0.7` follow-up adds a pairing-code flow so a user can link their local dash to their flood-g8.com account without baking Supabase keys into the VSIX bundle or running OAuth on `localhost`.

### Flow

1. User opens the FloodG8 dash from the VSIX sidebar (or runs `FloodG8: Connect to FloodG8 Cloud` from the command palette, which now opens `https://flood-g8.com/pair`).
2. The cloud `/pair` page (signed-in) calls `POST /api/runner/pair` → mints an 8-char code (10-min TTL) into `runner_pairings`.
3. User pastes the code into the local dash's "Sign in with FloodG8 Cloud" panel (`CloudPairPanel` component, shown in the sidebar footer + on `/login` when Supabase env isn't configured).
4. The SPA calls `POST /api/cloud/pair` (same-origin, handled by the local Fastify server) with `{ code }`.
5. The local server validates the code, generates a stable `deviceFingerprint` (random UUID, persisted in the `cloud_pairings` table so re-pairing reuses it), and calls `POST {FLOODG8_CLOUD_URL}/api/runner/pair?code=…` with `{ deviceFingerprint, allowedRoots: [] }`.
6. The cloud lambda upserts a `runner_devices` row, marks the pairing `redeemed`, and returns `{ runnerId, runnerName, orgId, orgName, orgSlug, email, relayChannel }`.
7. The local server stores the response in `cloud_pairings` (single-row, `id=1`) and returns it to the SPA.
8. The `CloudPairPanel` flips to "Linked to FloodG8 Cloud · {email} · {orgName}" with an "Unlink this dash" button. The state persists across reloads.

### Ponytail: pairing is identity, relay is transport

The pairing flow stores **display identity only** (`email`, `orgName`, `runnerId`, `relayChannel`). No Supabase tokens live in the local SQLite DB. The cloud relay's transport auth (`FLOODG8_RUNNER_TOKEN` — a scoped JWT) still comes from the runner's env, exactly as before. The two concerns are deliberately decoupled:

- **Pairing** = "which cloud account does this local dash belong to?" → answered by the code flow.
- **Relay** = "how does the local runner publish events to Supabase Realtime for the cloud LiveAgent page?" → answered by env vars.

Ceiling: a user who wants the live cloud view to work post-pairing still sets `FLOODG8_RUNNER_TOKEN` env. Upgrade path: the cloud lambda mints a runner-scoped JWT on redemption + returns it; the local server auto-starts the relay using the stored config. Marked inline in `packages/server/src/app.ts` + `packages/reservoir/src/cloud-pairing-store.ts`.

### Why no new Supabase migration

The cloud side already had `runner_pairings` + `runner_devices` from migration `20260620010000_runner_pairings.sql`. The `1.0.7` change is a backward-compatible extension of the redemption response (adds `email` + `orgName` + `orgSlug` fields) — no schema change. The new `cloud_pairings` table is **local SQLite** in the runner's reservoir (schema added to `packages/reservoir/src/schema.sql.ts`), NOT a Supabase migration.

### New local SQLite table

`cloud_pairings` (single-row, `id=1`, enforced by `CHECK (id = 1)`):

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | Always `1` |
| `device_fingerprint` | TEXT | Stable per-machine UUID, generated once + reused across re-pairings |
| `runner_id` | TEXT | From cloud redemption |
| `runner_name` | TEXT | From cloud redemption |
| `org_id` | TEXT | From cloud redemption |
| `org_name` | TEXT | From cloud redemption (`1.0.7`) |
| `org_slug` | TEXT | From cloud redemption (`1.0.7`) |
| `email` | TEXT | From cloud redemption (`1.0.7`) |
| `relay_channel` | TEXT | `runner:<runnerId>` |
| `paired_at` | TEXT | ISO timestamp |

**Code:** `F:\dev\floodg8\packages\reservoir\src\cloud-pairing-store.ts` (CRUD + `getOrCreateDeviceFingerprint`).

### VSIX command change

`floodG8.connect` ("Connect to FloodG8 Cloud") previously opened `https://flood-g8.com/settings?focus=heartbeat`. In `1.0.7` it now opens `https://flood-g8.com/pair` so the command maps directly to the pairing flow. The `floodG8.cloudToken` setting is unchanged — it's still the bearer token the extension uses for Standard suite API calls (Vault, Snippets, Regex) and is orthogonal to the pairing flow (which is about local-dash identity, not suite API auth).

### Validation (`1.0.7`)

| Check | Result |
| --- | --- |
| `pnpm --filter @floodg8/reservoir build` | ✅ clean |
| `pnpm --filter @floodg8/server typecheck` | ✅ clean |
| `pnpm --filter @floodg8/web typecheck` | ✅ clean |
| `pnpm --filter floodg8 typecheck` | ✅ clean |
| `pnpm --filter @floodg8/web build` | ✅ assert-bundle ok (77 assets, 38 chunks) |
| `pnpm --filter floodg8 package` | ✅ `releases/floodg8-1.0.7.vsix` (5.09 MB) |
| `cursor --install-extension floodg8-1.0.7.vsix` | ✅ `marketstandard.floodg8@1.0.7` installed |
| Cloud lambda `/api/runner/pair` redemption response | ✅ now includes `email` + `orgName` + `orgSlug` (live after next Vercel deploy) |

---

## Test fixtures + smoke scripts

### Test fixtures (`F:\dev\floodg8\tools\fixtures\`)

| Script | Purpose |
| --- | --- |
| `seed.ts` | Idempotent seed of bundle-grant rows + waitlist entries + pulse events + one agent report for a test user |
| `cleanup.ts` | Tears down everything `seed.ts` wrote (only touches rows with the `floodg8-bundle:` marker — preserves real direct-purchase rows) |

**Required env:**
```
SUPABASE_URL=https://opodtvblrelmpoaprmpr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
FLOODG8_SUITE_TEST_USER_ID=<uuid of test auth user>
FLOODG8_SUITE_TEST_STRIPE_SUBSCRIPTION_ID=sub_test_portfolio_seed  # optional, defaults to seed default
```

**Usage:**
```bash
pnpm --filter @floodg8/fixtures seed
pnpm --filter @floodg8/fixtures cleanup
```

### Smoke scripts (`F:\dev\floodg8\tools\smoke\`)

| Script | Purpose |
| --- | --- |
| `portfolio-endpoints.ts` | Hits every portfolio + runs endpoint and verifies the response shape (catalog count=17, agent-skill-version packageName, runs totalRuns is a number, etc.) |
| `portfolio-shots.ts` | Captures 10 Playwright screenshots of `/portfolio` at desktop + mobile viewports. Accepts `FLOODG8_TEST_TOKEN` env var to inject auth + render the authed state. |
| `smoke.ts` | Existing smoke runner — updated to include `/portfolio` in its route list |

**Usage:**
```bash
# Endpoint smoke (no token — only public endpoints)
node --experimental-strip-types tools/smoke/portfolio-endpoints.ts https://www.flood-g8.com

# Screenshots (no token — unauth state)
node --experimental-strip-types tools/smoke/portfolio-shots.ts https://www.flood-g8.com

# Screenshots (with token — authed state)
$env:FLOODG8_TEST_TOKEN="<supabase_access_token>"
node --experimental-strip-types tools/smoke/portfolio-shots.ts https://www.flood-g8.com
```

### Vitest specs

| File | Tests |
| --- | --- |
| `packages/shared/src/suite-urls.test.ts` | 7 tests — production hosts, local ports, env switching, path append |
| `packages/shared/src/pulse-event-types.test.ts` | 6 tests — 15 sources, type guard |
| `apps/extension/src/standard-commands.test.ts` | 4 tests — 16 commands registered, Market Standard category, editor/context + command palette entries |

**Total:** 17 new tests, all green. Full monorepo test suite: 62 tests pass.

---

## Environment variables

Added to `F:\dev\floodg8\.env.example`:

| Var | Default | Notes |
| --- | --- | --- |
| `FLOODG8_ENV` | `production` | Flip to `local` to point `suiteUrl()` at `localhost:30xx` for the Standard apps |
| `NEXT_PUBLIC_PORTFOLIO_CATALOG_URL` | `https://flood-g8.com/api/portfolio/catalog` | Consumed by SAAS apps (not FloodG8 itself) to fetch the shared catalog from the suite switcher in their dashboard shells. Set on each Standard app's Vercel project. |

Existing vars used by the integration:
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_JWT_SECRET` — FloodG8 project
- `SYNCDEVTIME_SUPABASE_URL` / `SYNCDEVTIME_SUPABASE_SERVICE_ROLE_KEY` — bridge to SyncDevTime project
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — shared Stripe account

---

## Coordination points with sibling plans

### `F:\dev\SAAS\docs\SAAS-FINISH.md` (Standard apps build)

| Standard app | What FloodG8 expects from the app build |
| --- | --- |
| `standard-vault` | `/api/projects` + `/api/projects/:id/secrets` endpoints (VSIX `vaultInjectTerminal` calls these). Schema already in `msvault.projects` + `msvault.secrets`. |
| `standard-snippets` | `/api/snippets` GET + POST endpoints (VSIX `snippetSaveSelection` + `snippetInsertPicker` call these). Schema already in `shared.snippets`. |
| `standard-regex` | `/api/patterns` GET + POST endpoints (VSIX `regexSaveToLibrary` calls POST; `regexTestSelection` is local-only). Schema already in `regex.patterns`. |
| `standard-links` | Schema `links.link_records` + `links.link_click_events` ready (migration `20260627060000`). App build owns the UI. |
| `standard-lens` | Catalog marks as `comingSoon: true`. Waitlist CTA writes to `shared.waitlist` with `product='standard-lens'`. Once the app ships, flip `comingSoon` to `false` in `catalog.js` and remove the waitlist CTA. |
| `standard-cron` | Same as `standard-lens`. |
| `standard-workspace` | Catalog entry exists (`comingSoon: false`). The `workspace.workspace_sessions` schema is NOT yet migrated — owned by the SAAS-FINISH plan. Once shipped, add a connection-detection count query to `summary.js`. |
| All `*.marketstandard.io` apps | Implement `/auth/callback` per the SSO contract above. Add FloodG8's `https://www.flood-g8.com` to the Supabase project's Auth → Redirect URLs allowlist (one-time setup). |

### `marketstandard-app\docs\SAAS_SUITE_DISPLAY.md` (marketing site)

The marketing site can fetch the catalog directly:
```bash
curl https://www.flood-g8.com/api/portfolio/catalog
# → { count: 17, products: [...] }
```

CORS is allowed from `*.marketstandard.app` + `*.marketstandard.io` so client-side fetches work without a proxy.

---

## Validation results (final)

| Check | Result |
| --- | --- |
| `pnpm typecheck` (37 packages) | ✅ clean |
| `pnpm test` (62 tests) | ✅ all green |
| `pnpm ponytail:audit` | ✅ lean, no findings on new work |
| `pnpm headroom:check` | ✅ ok (no ungated provider imports) |
| `pnpm --filter @floodg8/web build` | ✅ assert-bundle ok |
| Supabase `list_migrations` | ✅ all 30 migrations applied |
| Supabase `get_advisors` (security) | ✅ only 2 pre-existing WARNs (documented) |
| Supabase `execute_sql` table check | ✅ all 12 expected tables present |
| Vercel `get_deployment` | ✅ READY, aliased to `flood-g8.com` |
| Production `curl /api/portfolio/catalog` | ✅ `count: 17`, all 17 products |
| Production endpoint smoke | ✅ `/api/portfolio/catalog` + `/api/portfolio/agent-skill-version` both 200 |
| Production Playwright screenshots | ✅ 10 screenshots captured + embedded in `docs/SAAS_SUITE.md` |
| Swarm rework `pnpm typecheck` (22 packages, commit `fda73a9`) | ✅ clean |
| Swarm rework `pnpm test` (incl. 6 new swarm self-checks) | ✅ all green |
| Swarm rework `pnpm headroom:check` | ✅ ok (no ungated provider imports — LlmPlanner routes through `compressedComplete()`) |
| `1.0.7` `pnpm --filter @floodg8/{reservoir,server,web} typecheck` + `pnpm --filter floodg8 typecheck` | ✅ clean |
| `1.0.7` `pnpm --filter @floodg8/web build` | ✅ assert-bundle ok (77 assets, 38 chunks) |
| `1.0.7` `pnpm --filter floodg8 package` + `cursor --install-extension` | ✅ `marketstandard.floodg8@1.0.7` installed |

---

## File index (new + modified on FloodG8 side)

### New files (52)

```
apps/extension/src/standard-api.ts                              # typed client for Standard app APIs
apps/extension/src/standard-commands.test.ts                    # VSIX command registration test
apps/web/api/portfolio/agent-cost.js
apps/web/api/portfolio/agent-costs.js
apps/web/api/portfolio/agent-health.js
apps/web/api/portfolio/agent-report.js
apps/web/api/portfolio/agent-skill-version.js
apps/web/api/portfolio/catalog.js                               # 17-product catalog (source of truth)
apps/web/api/portfolio/pulse.js
apps/web/api/portfolio/sign-out-everywhere.js
apps/web/api/portfolio/sso-mint.js
apps/web/api/portfolio/summary.js
apps/web/api/portfolio/waitlist.js
apps/web/api/runs/summary.js
apps/web/src/components/AgentCostWidget.tsx
apps/web/src/components/AgentHealthPanel.tsx
apps/web/src/components/CloudPairPanel.tsx                       # 1.0.7 — "Sign in with FloodG8 Cloud" pairing panel
apps/web/src/components/HybridStandupTemplate.tsx
apps/web/src/pages/Portfolio.tsx                                # redesigned Portfolio page
docs/SAAS_SSO.md
docs/SAAS_SUITE.md                                              # architecture + screenshots
docs/SAAS_SUITE_INTEGRATION.md                                  # the 13-phase plan (pre-existing, referenced)
docs/STRIPE_WEBHOOK_MOCK.md
packages/reservoir/src/cloud-pairing-store.ts                    # 1.0.7 — local cloud_pairings CRUD + deviceFingerprint
packages/shared/src/pulse-event-types.ts                        # canonical 15-source registry
packages/shared/src/pulse-event-types.test.ts
packages/shared/src/suite-urls.ts                               # production + local-dev URL helper
packages/shared/src/suite-urls.test.ts
supabase/migrations/20260627060000_standard_links.sql
supabase/migrations/20260627070000_metrics_quota_samples.sql
supabase/migrations/20260627090000_standup_blocker_keywords.sql
supabase/migrations/20260627100000_shared_waitlist.sql
supabase/migrations/20260627120000_pulse_event_sources_expand.sql
tools/fixtures/package.json
tools/fixtures/seed.ts                                          # test fixture seeder
tools/fixtures/cleanup.ts                                       # test fixture cleanup
tools/smoke/portfolio-endpoints.ts                              # endpoint smoke
tools/smoke/portfolio-shots.ts                                  # 10-screenshot Playwright
tools/smoke/screenshots/portfolio/01-full-page-desktop.png
tools/smoke/screenshots/portfolio/02-full-page-mobile.png
tools/smoke/screenshots/portfolio/03-suite-health-header.png
tools/smoke/screenshots/portfolio/04-filter-bar.png
tools/smoke/screenshots/portfolio/05-product-grid.png
tools/smoke/screenshots/portfolio/06-coming-soon-card.png
tools/smoke/screenshots/portfolio/07-suite-pulse.png
tools/smoke/screenshots/portfolio/08-agent-health.png
tools/smoke/screenshots/portfolio/09-agent-cost.png
tools/smoke/screenshots/portfolio/10-hybrid-standup.png
```

### Modified files (22)

```
.env.example                                                    # + FLOODG8_ENV, NEXT_PUBLIC_PORTFOLIO_CATALOG_URL
apps/extension/package.json                                     # + 16 commands, + test script, + vitest devDep, version → 1.0.7
apps/extension/src/extension.ts                                 # + 16 command handlers; floodG8.connect → /pair (1.0.7)
apps/extension/README.md                                        # + Market Standard section
apps/web/api/_lib/auth.js                                       # CORS expanded for *.marketstandard.io
apps/web/api/integrations/syncdevtime/summary.js                # real aggregation (was stub)
apps/web/api/runner/pair.js                                     # 1.0.7 — redemption now returns email + orgName + orgSlug
apps/web/src/App.tsx                                            # Portfolio route
apps/web/src/components/Shell.tsx                               # Portfolio nav item; sidebar footer shows CloudPairPanel when no Supabase session (1.0.7)
apps/web/src/lib/api.ts                                         # + 11 new API methods + types; + cloudPairState/cloudPair/cloudUnpair (1.0.7)
apps/web/src/pages/Login.tsx                                    # 1.0.7 — show CloudPairPanel when !supabaseConfigured()
docs/BILLING.md                                                 # + SAAS bundle grant flow section
docs/COMPANION_PRODUCTS.md                                      # + SAAS suite section
docs/ENV.md                                                     # + SAAS suite env vars
docs/ROADMAP.md                                                 # + SAAS suite integration section
packages/billing/src/bundle-grant.ts                            # + grantPortfolioBundles + revokePortfolioBundles
packages/billing/src/webhook.ts                                 # wire bundle grant into webhook
packages/reservoir/src/index.ts                                 # export suite-urls + pulse-event-types; + CloudPairingStore (1.0.7)
packages/reservoir/src/schema.sql.ts                            # 1.0.7 — + cloud_pairings table
packages/server/src/app.ts                                      # 1.0.7 — + /api/cloud/pair (GET+POST) + /api/cloud/unpair (POST) routes; + CloudPairingStore wiring
packages/shared/src/entitlements.ts                             # + 13 Standard bundle keys on Team/Enterprise
packages/shared/src/index.ts                                    # export suite-urls + pulse-event-types
pnpm-lock.yaml                                                  # + vitest in extension
tools/smoke/smoke.ts                                            # + /portfolio route
```

### Deleted files (1)

```
api/integrations/syncdevtime/summary.js                         # root-level duplicate stub (Vercel only routes apps/web/api/)
```

---

## Outstanding (owned by sibling plans)

- [ ] **`1.0.7` Vercel redeploy** — the `apps/web/api/runner/pair.js` redemption-response extension (`email` + `orgName` + `orgSlug`) is committed in the floodg8 repo but NOT yet live on `flood-g8.com`. The local pairing flow will fail at the redemption step until the next Vercel deploy ships the lambda change. (The `floodG8.connect` command + local server routes + `CloudPairPanel` are all live in the VSIX `1.0.7` bundle regardless.)
- [ ] `standard-lens` app build — FloodG8 catalog already surfaces it as `comingSoon: true` with waitlist CTA
- [ ] `standard-cron` app build — same as `standard-lens`
- [ ] `standard-workspace` app build + `workspace.workspace_sessions` schema migration
- [ ] Cross-repo integration test harness in `F:\dev\SAAS\e2e\cross-repo\`
- [ ] Each `*.marketstandard.io` app implements `/auth/callback` per the SSO contract
- [ ] Supabase project Auth → Redirect URLs allowlist updated with each Standard app's `/auth/callback` URL
- [ ] Each Standard Stripe product carries `metadata.product=standard-{app}` + `metadata.plan_id=starter`
- [ ] **`1.0.7` follow-up (relay auto-start)** — the cloud lambda could mint a runner-scoped JWT on redemption + return it, so the local server can auto-start the cloud relay using the stored config instead of requiring `FLOODG8_RUNNER_TOKEN` env. Ponytail-marked ceiling in `packages/server/src/app.ts`.

Once `standard-lens` and `standard-cron` ship, flip their `comingSoon` flag to `false` in `F:\dev\floodg8\apps\web\api\portfolio\catalog.js` and remove the waitlist CTA from `Portfolio.tsx` (the CTA renders automatically when `comingSoon: true`).

**Once any Standard app ships**, also flip its `deployed: true` flag in `catalog.js`. The Portfolio card + sidebar section will automatically switch from "in build" to "live" + the "Open" button will auto-mint SSO + open the app.

---

## Contacts + references

- **FloodG8 repo:** `F:\dev\floodg8` (GitHub: `Encryptic1/floodg8`)
- **Plan doc:** `F:\dev\floodg8\docs\SAAS_SUITE_INTEGRATION.md`
- **Architecture doc:** `F:\dev\floodg8\docs\SAAS_SUITE.md`
- **SSO doc:** `F:\dev\floodg8\docs\SAAS_SSO.md`
- **Stripe webhook mock doc:** `F:\dev\floodg8\docs\STRIPE_WEBHOOK_MOCK.md`
- **Production URL:** <https://www.flood-g8.com/portfolio>
- **Catalog endpoint:** <https://www.flood-g8.com/api/portfolio/catalog>
- **Vercel deployment:** `dpl_ACbynrbPxt79CU51tmYDxt6hGW3L` (READY)
- **Supabase project ref:** `opodtvblrelmpoaprmpr`
- **Stripe account:** `acct_1SuF7uIJbuHvnqyq` (shared with SyncDevTime)
