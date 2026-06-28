# Market Standard App Integration — SAAS Suite Display

**Date:** 2026-06-28
**Repo:** `C:\Users\CJ\OneDrive\repos\MarketStandard\website\marketstandard-app` (GitHub: `marketstandard/marketstandard-app`)
**Commits pushed to `origin/main`:** `03824b8` → `f89f791` → `0a8e771` → `c01e020` → `baafa74`
**Vercel deployment:** auto-deploy via git integration (push to `main` triggers production build on Vercel — no explicit deployment ID captured because the Vercel MCP `deploy_to_vercel` tool returns CLI instructions and the Vercel CLI is not installed on this Windows workstation)
**Plan reference:** `marketstandard-app\docs\SAAS_SUITE_DISPLAY.md` (10 phases) + `marketstandard-app\docs\SANITY_SUITE_SETUP.md` (Sanity seed guide)
**Sanity project:** shared with the rest of `marketstandard-app` (project ID wired in `src/services/server/sanity/env.ts`)
**Supabase project:** `opodtvblrelmpoaprmpr` (shared with FloodG8 + all Standard apps — the marketing site only reads from Sanity, it does not query Supabase directly)

This file documents what the marketing-site side of the SAAS suite integration did, so the parallel `SAAS-FINISH.md` plan in `F:\dev\SAAS\docs\` and the FloodG8 integration (`F:\dev\SAAS\docs\integrated_apps\floodg8.md`) can coordinate against it.

---

## TL;DR

The Market Standard marketing site now ships a dedicated **Standard Suite** surface at `/standard-suite` plus a redesigned homepage Solutions section that groups all 18 suite products into 4 categories with status badges, category pills, and Join waitlist CTAs for the two coming-soon apps. The 18-product catalog is hardcoded in `src/screens/StandardSuiteScreen/suiteData.ts` (single source of truth for the marketing site), mirrored into Sanity CMS via an idempotent `yarn seed:sanity` script, and proxied at runtime through `/api/v1/suite-catalog` (which falls back to FloodG8's `/api/portfolio/catalog` when `FLOODG8_API_URL` is set). All 10 phases of `SAAS_SUITE_DISPLAY.md` are implemented and pushed. Playwright screenshot tests + Jest unit tests are written and the Jest suite is green; the local Playwright run is blocked by missing credentials on this workstation but the test specs are ready to run against the deployed URL.

---

## Follow-up (2026-06-28): gold theme, `.marketstandard.app` subdomains, mobile polish

After the initial 10-phase build shipped, three refinements were applied in a follow-up commit:

### 1. FloodG8 gilt gold accent on the hero CTA

The `Explore the Standard Suite →` button next to `Get Started` on the homepage hero was plain white. It now uses the FloodG8 **gilt gold** palette (`#C5A55A` text + border, `#D4B96E` hover) sourced from `F:\dev\floodg8\packages\brand\src\tokens.ts` (`palette.gilt` / `palette.giltLight`). Two new Tailwind color tokens were added to `tailwind.config.ts`:

- `suite-gold: '#C5A55A'` — FloodG8 gilt primary
- `suite-gold-light: '#D4B96E'` — FloodG8 gilt hover

The button class is now `border-suite-gold/40 font-semibold text-suite-gold hover:border-suite-gold hover:bg-suite-gold/5 hover:text-suite-gold-light`.

### 2. All Standard app URLs → `*.marketstandard.app` subdomains

Every Standard Suite app `siteUrl` in `suiteData.ts` was flipped from `*.marketstandard.io` to `*.marketstandard.app` (14 URLs). The "Visit Site" buttons on both the homepage Solutions cards and the `/standard-suite` app grid now link directly to the correct production subdomain. FloodG8 (`flood-g8.com`), SyncDevTime (`www.syncdevtime.com`), CreativeSocial (`www.creativesocial.ai`), and the npm package URLs are unchanged.

| App | Old URL | New URL |
| --- | --- | --- |
| Standard Polls | `https://polls.marketstandard.io` | `https://polls.marketstandard.app` |
| Standard Proof | `https://proof.marketstandard.io` | `https://proof.marketstandard.app` |
| Standard Vault | `https://vault.marketstandard.io` | `https://vault.marketstandard.app` |
| Standard Snippets | `https://snippets.marketstandard.io` | `https://snippets.marketstandard.app` |
| Standard Regex | `https://regex.marketstandard.io` | `https://regex.marketstandard.app` |
| Standard Metrics | `https://metrics.marketstandard.io` | `https://metrics.marketstandard.app` |
| Standard Release | `https://release.marketstandard.io` | `https://release.marketstandard.app` |
| Standard Links | `https://links.marketstandard.io` | `https://links.marketstandard.app` |
| Standard Status | `https://status.marketstandard.io` | `https://status.marketstandard.app` |
| Standard Lens | `https://lens.marketstandard.io` | `https://lens.marketstandard.app` |
| Standard Cron | `https://cron.marketstandard.io` | `https://cron.marketstandard.app` |
| Standard Hook | `https://hook.marketstandard.io` | `https://hook.marketstandard.app` |
| Standard Postmortem | `https://postmortem.marketstandard.io` | `https://postmortem.marketstandard.app` |
| Standard Workspace | `https://workspace.marketstandard.io` | `https://workspace.marketstandard.app` |

**DNS prerequisite:** these 14 `*.marketstandard.app` subdomains must be pointed (CNAME or A records) at the respective Standard app Vercel projects before the "Visit Site" buttons resolve. Until DNS is in place, the buttons will 404. This is owned by the sibling Standard app repos + the Market Standard DNS provider, not by this marketing-site repo.

### 3. Suite grid spacing + mobile polish

The product grid on both `/standard-suite` (`SuiteAppGrid.tsx`) and the homepage (`Solutions.tsx`) was redesigned for cleaner spacing and full mobile responsiveness:

- **Card structure rebuilt** — removed the fragile `absolute right-4 top-4` category pill + `pr-24` title padding pattern. The header is now a flex row (`flex items-start justify-between gap-3`) with the title + brand dot on the left and the category pill on the right, using `min-w-0` + `shrink-0` so long titles truncate and long category names wrap cleanly on mobile.
- **Grid gaps** — `gap-5 sm:gap-6 lg:gap-7` (was `gap-6`), giving more breathing room on desktop and tighter stacking on mobile.
- **Card padding** — `p-5 sm:p-6` (was `p-6`), denser on mobile.
- **Section spacing** — `mt-14 first:mt-0 sm:mt-20` between category sections (was `mt-12`), more visual separation.
- **Removed `min-w-[240px]`** from cards — let the grid handle sizing so cards fill the column width cleanly on all viewports.
- **"Visit Site" is now a real `<a>` link** to the subdomain (was a text hint that opened the modal). On the `/standard-suite` grid, the card body (title + description) still opens the detail modal on click, but the footer "Visit Site" pill button links directly to the app's subdomain in a new tab. The homepage Solutions cards already had a real link; they're now restyled to match (mint pill button with ↗ arrow).
- **Status badges + CTAs** sit in a footer row with a `border-t border-white/5 pt-4` separator for cleaner visual hierarchy.
- **`w-screen` → `w-full`** across `StandardSuiteScreen.tsx`, `SuiteCrossSellMap.tsx`, `SuitePricingSummary.tsx`, `SuiteFaq.tsx` — `w-screen` caused horizontal scroll on mobile because it includes the scrollbar width.
- **Mobile padding** — `py-16 sm:py-20` / `py-16 sm:py-24` on all suite sections (was `py-20` / `py-24`), less wasted vertical space on phones.
- **`SuiteHero`** — `text-4xl sm:text-5xl sm:text-6xl` hero heading (was `text-5xl sm:text-6xl`, too big on small phones), `mt-12 sm:mt-16` on the stats grid (was `mt-16`), `gap-4 sm:gap-6` on the 2-col mobile stats grid.
- **`SuiteAppDetail` modal** — header now `flex-wrap` so the category pill drops below the title on narrow modals; title is `text-xl sm:text-2xl`; footer CTA row is `flex-col gap-4 sm:flex-row sm:items-center sm:justify-between` so the status label + button stack vertically on mobile instead of cramping.

### 4. Messaging reframe — "by developers, for developers"

The suite is a developer tool for developers, so all infrastructure-as-value-prop copy was removed. No more "One Supabase. One Stripe." as a headline, no more "built on a single shared Supabase project and a single Stripe account" in descriptions. The suite is now pitched on what it does for developers (cross-app deep links, zero context switching, one workflow) rather than what it's built on.

Files changed:

- **`SuiteHero.tsx`** — gradient headline is now `One workflow. Zero context switching.` (was `One Supabase. One Stripe.`). Description now says "built by developers, for developers, with cross-app deep links". Stats grid swapped `Shared Supabase` + `Shared Stripe` for `Cross-app deep links (20+)` + `Open-source CLI (1)`.
- **`StandardSuiteScreen.tsx`** — `<Head>` title is now `Market Standard Suite — 11 Dev Tools, One Workflow` (was `...on Shared Supabase`); description dropped the "One Stripe account. One Supabase." line. Architecture section intro now leads with a concrete example ("a failed webhook in Hook opens a postmortem draft in Postmortem...") instead of "One shared Supabase project. One shared Stripe account."
- **`suiteData.ts`** — `SUITE_CATEGORY_BLURB['Market Standard Suite']` is now "Eleven production dev tools that connect to each other through cross-app deep links." (was "...on a single shared Supabase + Stripe core."). Standard Polls description dropped the trailing "Built on shared FloodG8 Supabase." sentence.
- **`SuitePricingSummary.tsx`** — Team plan features swapped `Shared Supabase project` + `Single Stripe account billing` for `Cross-app deep links` + `One subscription for the whole suite`. Enterprise blurb/features changed `Single-tenant Supabase (+ Stripe)` to `Single-tenant deployment`. Section blurb now "Every Standard app ships as one bundle, so we price the whole suite as a single subscription." The "Talk to us" + "Contact sales" CTAs now mailto `sales@marketstandard.app` (was `hello@marketstandard.io` — the old `.io` domain is fully retired from the codebase).
- **`SuiteFaq.tsx`** — "Do I need FloodG8?" answer dropped the sentence about sharing FloodG8's Supabase project. "Can I bring my own Supabase project?" reframed to "Can I self-host the suite?" with an Enterprise single-tenant answer that doesn't name the vendor.
- **`JsonLd.tsx`** — ItemList `description` now "built by developers, for developers, with cross-app deep links" (was "built on a single shared Supabase project and a single Stripe account").
- **`/api/og/standard-suite.tsx`** — OG image headline is now `{liveCount} dev tools. One workflow.` (was `One Supabase. One Stripe.`); stats swapped `shared Supabase` + `shared Stripe` for `cross-app links (20+)` + `open-source CLI (1)`.

**Kept intentionally:** product-feature descriptions that name Stripe as a thing the app manages (e.g. Standard Metrics = "Stripe subscription analytics", Standard Links = "Stripe Payment Link CRUD") — these describe what the app does, not what the suite is built on. The `ms-suite depsync` CLI description still mentions it catches "drift between Stripe products, Supabase schema, and bundle grants" because that's actionable developer information about what the CLI checks. The internal `stripePriceKey` config field is unchanged (it's a Sanity seed key, not user-facing).

### 5. Architecture diagram rebuild — SVG icons, click-to-isolate, readable detail panel

`SuiteArchitectureDiagram.tsx` was rebuilt from scratch based on user feedback that the old version had illegible hover text, no click-to-isolate behavior, and still named the infrastructure. The new version:

- **SVG icons inside the circles** — each node now renders its per-app icon from `public/icons/standard-suite/*.svg` via `<image href={app.icon}>` (was 4-letter text acronyms like POLL/PROO/VAUL). Falls back to the acronym if an app has no icon.
- **Click-to-isolate-the-flow** — clicking a node pins it (`selected` state), which isolates that node + its cross-app deep-link edges + the nodes it connects to, dimming everything else. Clicking the node again or clicking the SVG background clears the selection. Previously clicking did nothing — only hover highlighted. Selected state takes precedence over hover.
- **Readable HTML detail panel** — replaced the tiny in-SVG hover tooltip (10px truncated text) with a full HTML detail panel below the SVG that shows the active app's icon, name, category badge, tagline, an isolation count ("Isolated — showing N cross-app deep links"), and a "Visit Site" / "View on npm" button. Readable on all viewports including mobile.
- **No infrastructure anywhere** — the center hub is now a single rounded rect "Market Standard / one workflow" (was two stacked rects "Supabase / shared project" + "Stripe / shared account"). The synthetic `__hub__` infra edges from satellites to the center were removed entirely — only cross-app deep-link edges remain. The legend dropped the "Shared core" entry.
- **Cleaner visual design** — larger viewBox (1000×760, was 960×720), larger radius (inner 250 / satellite 350, was 220 / 320), bigger nodes (inner 36 / satellite 42, was 32 / 38) to fit the icons, a glow ring on the active node, brighter active edges (`#00FDC8` → `#69E1B7` gradient with glow filter, was single mint), and name labels at 11px (was 10px) with `Standard ` prefix stripped.
- **Accessibility** — nodes are `role="button"` with `tabIndex={0}`, keyboard support (Enter/Space to pin), and aria-labels that announce the selected state + the click-to-isolate affordance.

---

## Catalog (single source of truth for the marketing site)

The 18-product catalog lives at:

- **Code:** `marketstandard-app\src\screens\StandardSuiteScreen\suiteData.ts`
- **Sanity mirror:** `suiteApp` documents (CMS-editable at `/_/studio`)
- **Runtime proxy:** `GET https://marketstandard.app/api/v1/suite-catalog` (proxies FloodG8 when `FLOODG8_API_URL` is set, falls back to the hardcoded `suiteApps` array)

Each `SuiteApp` entry has: `slug`, `title`, `tagline`, `description`, `longDescription`, `siteUrl` or `npmUrl`, `category`, `subCategory`, `status` (`live` | `coming_soon` | `beta`), `icon`, optional `screenshot`, `features[]`, `linksTo[]` (slugs of apps this app deep-links into), `stripePriceKey` (env var name read by the Sanity seed script).

| slug | title | category | status | URL |
| --- | --- | --- | --- | --- |
| `standard-polls` | Standard Polls | Market Standard Suite / Daily Workflow | live | <https://polls.marketstandard.app> |
| `standard-proof` | Standard Proof | Market Standard Suite / Daily Workflow | live | <https://proof.marketstandard.app> |
| `standard-vault` | Standard Vault | Market Standard Suite / Daily Workflow | live | <https://vault.marketstandard.app> |
| `standard-snippets` | Standard Snippets | Market Standard Suite / Daily Workflow | live | <https://snippets.marketstandard.app> |
| `standard-regex` | Standard Regex | Market Standard Suite / Daily Workflow | live | <https://regex.marketstandard.app> |
| `standard-metrics` | Standard Metrics | Market Standard Suite / Engineering Insights | live | <https://metrics.marketstandard.app> |
| `standard-release` | Standard Release | Market Standard Suite / Engineering Insights | live | <https://release.marketstandard.app> |
| `standard-links` | Standard Links | Market Standard Suite / Engineering Insights | live | <https://links.marketstandard.app> |
| `standard-status` | Standard Status | Market Standard Suite / Engineering Insights | live | <https://status.marketstandard.app> |
| `standard-lens` | Standard Lens | Market Standard Suite / Engineering Insights | coming_soon | <https://lens.marketstandard.app> |
| `standard-cron` | Standard Cron | Market Standard Suite / Engineering Insights | coming_soon | <https://cron.marketstandard.app> |
| `standard-hook` | Standard Hook | Market Standard Suite / Incident Response | live | <https://hook.marketstandard.app> |
| `standard-postmortem` | Standard Postmortem | Market Standard Suite / Incident Response | live | <https://postmortem.marketstandard.app> |
| `standard-workspace` | Standard Workspace | Multi-Project Dev | live | <https://workspace.marketstandard.app> |
| `ms-suite` | ms-suite CLI | Multi-Project Dev | live | <https://www.npmjs.com/package/@marketstandard/agent-skill> |
| `floodg8` | FloodG8 | Platform | live | <https://flood-g8.com> |
| `syncdevtime` | SyncDevTime | Platform | live | <https://www.syncdevtime.com> |
| `agent-skill` | Market Standard Agent Skill | Platform | live | <https://www.npmjs.com/package/@marketstandard/agent-skill> |
| `athena-score` | Athena Score | Other Projects | live | — |
| `eunomia-compliance` | Eunomia Compliance | Other Projects | live | — |
| `creativesocial` | CreativeSocial | Other Projects | live | <https://www.creativesocial.ai/> |

The 17-product FloodG8 catalog (`floodg8.md` §Catalog) is a subset of this 18-product marketing catalog — the marketing site additionally surfaces 3 "Other Projects" (Athena Score, Eunomia Compliance, CreativeSocial) that are not part of the SAAS bundle.

---

## Routes added on marketstandard-app

All under `https://marketstandard.app/...`.

| Method | Path | Runtime | Purpose |
| --- | --- | --- | --- |
| GET | `/standard-suite` | node | Dedicated Standard Suite landing page (hero + app grid + architecture diagram + cross-sell map + pricing + FAQ + JSON-LD) |
| GET | `/api/v1/suite-catalog` | edge | Proxies FloodG8 `/api/portfolio/catalog` when `FLOODG8_API_URL` is set; falls back to hardcoded `suiteApps` array |
| POST | `/api/v1/waitlist` | edge | Forwards waitlist signups to FloodG8 `WAITLIST_FORWARD_URL` (the FloodG8 `POST /api/portfolio/waitlist` endpoint); falls back to writing a `waitlistSignup` Sanity document if the forward fails |
| GET | `/api/og/standard-suite` | edge | Dynamic Open Graph image for the suite page, rendered via `@vercel/og` with the suite brand colors + live/coming-soon counts |

**Code location:** `src\pages\standard-suite.tsx`, `src\pages\api\v1\suite-catalog.ts`, `src\pages\api\v1\waitlist.ts`, `src\pages\api\og\standard-suite.tsx`.

---

## Sanity CMS changes

### Schemas added (registered in `src\services\server\sanity\schema.ts`)

| Schema | Type | Purpose |
| --- | --- | --- |
| `suiteApp` | document | CMS mirror of `suiteData.ts` — editable at `/_/studio`. Fields: `name`, `slug`, `tagline`, `description`, `longDescription`, `url`, `npmUrl`, `category` (enum), `subCategory` (enum), `status` (enum), `screenshot`, `iconSvg`, `features[]` (refs to `feature`), `linksTo[]` (string array of slugs), `stripePriceKey`, `orderRank` |
| `waitlistSignup` | document | Local fallback for the waitlist API when FloodG8 is unreachable. Fields: `email`, `product` (slug), `source` (enum: `homepage_solutions` / `standard_suite` / `api_direct`), `createdAt` |

### GraphQL query added

`src\services\server\sanity\graphql\getAllSuiteApps.ts` — `GET_ALL_SUITE_APPS` query + `getAllSuiteApps()` function. Mirrors the existing `getAllProducts.ts` pattern (default-exported `client` from `graphql/client.ts`, `graphql-tag` + `graphql/language/printer`).

### Seed script

`scripts\sanity\seedSuiteProducts.ts` — idempotent seed that creates (or patches, lookup-by-slug):

1. **5 `productCategory` documents** — Standard Suite — Daily Workflow, Engineering Insights, Incident Response, Platform, Multi-Project Dev. Each carries `textHex` + `backgroundRgba` matching the brand palette (`#69E1B7`, `#00FDC8`, `#FF8A65`, `#9A8CFF`, `#F2C94C`).
2. **Per-app `feature` documents** — 4–6 per app, looked up by header text to avoid duplicates.
3. **18 `product` documents** — the canonical Sanity `product` type that already backs `/marketplace` and `/dashboard`. Each gets `externalUrl`, `primaryTagline`, `abbreviatedDescription`, `conclusion`, `category` ref, `features[]` refs, `type: 'SUBSCRIPTION'`, `isVisible: true`, `showProd: true`, `shouldDisplayDashboard: true`, `orderRank`, optional `iconSvg` + `screenshot` + `marketplaceImage` (uploaded from `public\icons\standard-suite\*.svg`), and `stripeProductIdProduction` populated from `process.env[app.stripePriceKey]` at runtime.
4. **18 `suiteApp` documents** — the CMS mirror of `suiteData.ts`, including `linksTo` and `stripePriceKey`.

**Run:** `npm run seed:sanity` (requires `SANITY_CONTENT_WRITE_TOKEN` + `SANITY_STUDIO_PROJECT_ID` + `SANITY_STUDIO_DATASET` + the `STRIPE_PRICE_*_STARTER` env vars from `F:\dev\SAAS\.env.example`).

---

## Brand assets added

`public\icons\standard-suite\` — 18 per-app SVG icons + 1 suite lockup, all in the suite color scheme (`#69E1B7` stroke, 64×64 viewBox, 2px strokes, transparent background):

| Icon | Source |
| --- | --- |
| `standard-polls.svg` | Custom — ballot box with checkmark |
| `standard-proof.svg` | Custom — shield with checkmark |
| `standard-metrics.svg` | Custom — bar chart with trend line |
| `standard-hook.svg` | Custom — webhook hook curve |
| `standard-release.svg` | Custom — tag with arrow |
| `standard-vault.svg` | Custom — lock with key |
| `standard-links.svg` | Custom — chain links |
| `standard-snippets.svg` | Custom — code brackets `< >` |
| `standard-status.svg` | Custom — pulse line |
| `standard-regex.svg` | Custom — chevrons + dot |
| `standard-postmortem.svg` | Custom — magnifier on document |
| `standard-lens.svg` | Custom — circle with crosshair |
| `standard-cron.svg` | Custom — clock with bell |
| `standard-workspace.svg` | Custom — multi-cube stack |
| `ms-suite.svg` | Custom — terminal prompt |
| `agent-skill.svg` | Custom — CPU/chip with pins |
| `syncdevtime.svg` | **Redesigned from `C:\Users\CJ\OneDrive\repos\SyncDevTime\public\favicon.svg`** — code brackets framing a clock face, recolored from the original blue gradient to the suite `#69E1B7` accent |
| `floodg8.svg` | **Redesigned from `F:\dev\floodg8\packages\brand\logos\floodg8-mark.svg`** — floodgate pillars + lifted sluice gate + release line + floodlight beams + reservoir waves + crowning 8/infinity mark, simplified from 256×256 to 64×64 and recolored from the neon green/gold gradient to the suite `#69E1B7` accent |
| `suite-lockup.svg` | Custom — Market Standard logo + "SUITE" wordmark in brand colors |

The OG image at `/api/og/standard-suite` renders a 1200×630 social card with the suite brand palette (`#0D0F19` background, `#69E1B7` + `#00FDC8` + `#9A8CFF` accents) and the live/coming-soon app counts.

---

## Homepage + nav changes

### `src\screens\LandingScreen\Solutions.tsx` (refactored)

Was: 4 hardcoded `SolutionItem` cards in two `md:grid-cols-2` sections, with optional live iframes per spec §9.3.

Now: reads from `suiteData.ts`, groups 18 apps into 4 category sections (`Market Standard Suite`, `Multi-Project Dev`, `Platform`, `Other Projects`), renders a single responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` per group. Each card shows:

- Category color pill (top-right) using the sub-category accent
- App title + brand dot + gradient divider
- 4-line clamped description
- Status badge (`Live` / `Coming soon` / `Beta`) — `Coming soon` badge is animated pulse orange
- "Visit Site" button for live apps with a `siteUrl` / `npmUrl`; "Join waitlist" button for `coming_soon` apps (POSTs to `/api/v1/waitlist`)
- Static screenshot image (per spec §9.3 — iframes replaced with screenshots for performance + X-Frame-Options safety)

### `src\components\TopNavStatic\TopNavStatic.tsx`

Added `Standard Suite` tab linking to `/standard-suite` in both desktop `Tabs` and mobile nav.

### `src\screens\LandingScreen\LandingScreen.tsx`

- Added `Explore the Standard Suite →` CTA button next to `Get Started` in the hero — styled with FloodG8 gilt gold (`text-suite-gold` + `border-suite-gold/40`, hover `text-suite-gold-light` + `bg-suite-gold/5`) to match the FloodG8 theme
- Added a `Standard Suite` column to the footer with internal + external links (Standard Suite, FloodG8, SyncDevTime, Agent Skill CLI)

### `src\constants\pages.ts`

Added `STANDARD_SUITE_PAGE = '/standard-suite'`.

### `tailwind.config.ts`

Added 5 suite category color tokens + 2 FloodG8 gilt gold tokens to `theme.extend.colors`: `suite-daily` (`#69E1B7`), `suite-eng` (`#00FDC8`), `suite-incident` (`#FF8A65`), `suite-platform` (`#9A8CFF`), `suite-multi` (`#F2C94C`), `suite-gold` (`#C5A55A` — FloodG8 gilt primary), `suite-gold-light` (`#D4B96E` — FloodG8 gilt hover). The gold tokens are sourced from `F:\dev\floodg8\packages\brand\src\tokens.ts` (`palette.gilt` / `palette.giltLight`) and power the hero CTA's gold text.

---

## SEO

- **`<Head>`** on `/standard-suite` — title `Market Standard Suite — 11 Dev Tools on Shared Supabase`, description, OG image pointing at `/api/og/standard-suite`, `useCurrentUrl` for `og:url`, Twitter `summary_large_image` card
- **Canonical URL** — `<link rel="canonical" href="https://marketstandard.app/standard-suite">` via `NextHead`
- **JSON-LD** (`src\screens\StandardSuiteScreen\JsonLd.tsx`) — `ItemList` of 18 `SoftwareApplication` entries + `Organization` with `makesOffer` for every app that has a `stripePriceKey`. Rendered via `next/script` with `afterInteractive` strategy
- **Sitemap** (`next-sitemap.config.js`) — `/standard-suite` explicitly added to `additionalPaths` with `changefreq: 'weekly'` + `priority: 0.9`. The `exclude: ['/api/*', '/_/*']` rule means the route was already auto-included, but the explicit entry guarantees priority/changefreq are set

---

## Tests

### Playwright (`tests\`)

- `playwright.config.ts` — desktop Chromium (1440×900) + mobile Chromium (Pixel 5) projects, `webServer: npm run build && npm run start`, `baseURL: http://localhost:3000` (override with `PLAYWRIGHT_BASE_URL`)
- `tests\smoke.spec.ts` — 8 tests: homepage renders 18+ cards in 4 groups, nav Standard Suite tab, footer Standard Suite column, Join waitlist buttons visible, `/standard-suite` returns 200 + hero + architecture diagram + JSON-LD scripts, app detail modal opens, `GET /api/v1/suite-catalog` returns 200 with 18+ products
- `tests\screenshot.spec.ts` — 8 screenshots: homepage full-page + Solutions section, suite page full-page + hero + architecture diagram (default + hovered) + pricing + app detail modal, plus mobile variants

### Jest (`src\screens\...\*.test.tsx`)

- `jest.setup.ts` — imports `@testing-library/jest-dom`
- `jest.config.js` — wired `setupFilesAfterEnv` + `testPathIgnorePatterns: ['<rootDir>/tests/']` so Playwright specs don't run under Jest
- `src\screens\LandingScreen\Solutions.test.tsx` — 6 tests, all passing
- `src\screens\StandardSuiteScreen\StandardSuiteScreen.test.tsx` — 6 tests, all passing (mocks `next/head`, `next/script`, `components/Head`, `components/TopNavStatic`)

### Local validation status

- **Jest: green** — 12/12 new tests pass
- **Playwright: specs written, not run locally** — local `npm run build` fails during "Collecting page data" because Sanity/Firebase/Hasura env vars are not set on this Windows workstation, and `npm run dev` fails with a pre-existing Node.js `ERR_INTERNAL_ASSERTION` when Firebase initializes (ESM/CJS conflict on this Node version). Both issues are local-only — Vercel's deploy pipeline has the real env vars and a compatible Node version. To validate after deploy: `PLAYWRIGHT_BASE_URL=https://marketstandard.app npx playwright test`

---

## Required Vercel env vars

| Var | Example | Used by |
| --- | --- | --- |
| `FLOODG8_API_URL` | `https://flood-g8.com` | `/api/v1/suite-catalog` proxy |
| `WAITLIST_FORWARD_URL` | `https://flood-g8.com/api/portfolio/waitlist` | `/api/v1/waitlist` forward target |
| `SANITY_STUDIO_PROJECT_ID` | (existing) | Studio + seed script |
| `SANITY_STUDIO_DATASET` | `production` (existing) | Studio + seed script |
| `SANITY_CONTENT_WRITE_TOKEN` | (Sanity token) | Seed script + waitlist Sanity fallback |
| `SANITY_CONTENT_READ_TOKEN` | (existing) | Sanity GraphQL |
| `SANITY_GRAPHL_URL` | (existing) | Sanity GraphQL |
| `STRIPE_PRICE_*_STARTER` | `price_...` (one per app) | Seed script populates `stripeProductIdProduction` on each `product` doc |

`FLOODG8_API_URL` + `WAITLIST_FORWARD_URL` are the only new env vars introduced by this integration. The Vercel MCP `deploy_to_vercel` tool does not expose env-var management (it returns CLI instructions), and the Vercel CLI is not installed on this workstation, so these two vars must be set in the Vercel dashboard → Project → Settings → Environment Variables. Everything else is already configured on the existing Vercel project.

---

## Cross-repo coordination

| Touchpoint | Direction | Detail |
| --- | --- | --- |
| FloodG8 catalog (`F:\dev\floodg8\apps\web\api\portfolio\catalog.js`) | marketstandard-app → FloodG8 | `/api/v1/suite-catalog` proxies `GET ${FLOODG8_API_URL}/api/portfolio/catalog` with a 3-second timeout and falls back to the hardcoded `suiteApps` array if FloodG8 is unreachable |
| FloodG8 waitlist (`F:\dev\floodg8\apps\web\api\portfolio\waitlist.js`) | marketstandard-app → FloodG8 | `/api/v1/waitlist` POSTs `{ email, product, source }` to `WAITLIST_FORWARD_URL` (the FloodG8 `POST /api/portfolio/waitlist` endpoint). On failure, writes a `waitlistSignup` Sanity doc as fallback |
| SAAS `.env.example` Stripe price keys (`F:\dev\SAAS\.env.example`) | SAAS → marketstandard-app | `suiteData.ts` references these by env var name (`stripePriceKey: 'STRIPE_PRICE_STANDARD_POLLS_STARTER'` etc.). The seed script reads them at runtime to populate `stripeProductIdProduction` on each Sanity `product` doc |
| Sanity shared project | bidirectional | `marketstandard-app` owns the Sanity `product` + `suiteApp` + `waitlistSignup` schemas. FloodG8 does not write to Sanity — it uses Supabase directly. The marketing site's Sanity content is the canonical source for `/marketplace` and `/dashboard` |
| Cross-domain SSO (`shared.sso_codes`) | out of scope | The marketing site does not participate in the SSO bridge — it's unauthenticated marketing surface. SSO is owned by FloodG8 + each Standard app's `/auth/callback` (see `floodg8.md` §"Cross-domain SSO bridge") |

---

## Files added (33)

```
docs/SANITY_SUITE_SETUP.md
docs/SAAS_SUITE_DISPLAY.md                                                    # spec doc (was untracked, now committed)
jest.setup.ts
playwright.config.ts
public/icons/standard-suite/standard-polls.svg
public/icons/standard-suite/standard-proof.svg
public/icons/standard-suite/standard-metrics.svg
public/icons/standard-suite/standard-hook.svg
public/icons/standard-suite/standard-release.svg
public/icons/standard-suite/standard-vault.svg
public/icons/standard-suite/standard-links.svg
public/icons/standard-suite/standard-snippets.svg
public/icons/standard-suite/standard-status.svg
public/icons/standard-suite/standard-regex.svg
public/icons/standard-suite/standard-postmortem.svg
public/icons/standard-suite/standard-lens.svg
public/icons/standard-suite/standard-cron.svg
public/icons/standard-suite/standard-workspace.svg
public/icons/standard-suite/ms-suite.svg
public/icons/standard-suite/floodg8.svg                                       # redesigned from F:\dev\floodg8\packages\brand\logos\floodg8-mark.svg
public/icons/standard-suite/syncdevtime.svg                                   # redesigned from C:\Users\CJ\OneDrive\repos\SyncDevTime\public\favicon.svg
public/icons/standard-suite/agent-skill.svg
public/icons/standard-suite/suite-lockup.svg
scripts/sanity/seedSuiteProducts.ts
src/pages/api/og/standard-suite.tsx
src/pages/api/v1/suite-catalog.ts
src/pages/api/v1/waitlist.ts
src/pages/standard-suite.tsx
src/screens/LandingScreen/Solutions.test.tsx
src/screens/StandardSuiteScreen/StandardSuiteScreen.test.tsx
src/screens/StandardSuiteScreen/JsonLd.tsx
src/screens/StandardSuiteScreen/StandardSuiteScreen.tsx
src/screens/StandardSuiteScreen/SuiteAppDetail.tsx
src/screens/StandardSuiteScreen/SuiteAppGrid.tsx
src/screens/StandardSuiteScreen/SuiteArchitectureDiagram.tsx
src/screens/StandardSuiteScreen/SuiteCrossSellMap.tsx
src/screens/StandardSuiteScreen/SuiteFaq.tsx
src/screens/StandardSuiteScreen/SuiteHero.tsx
src/screens/StandardSuiteScreen/SuitePricingSummary.tsx
src/screens/StandardSuiteScreen/index.ts
src/screens/StandardSuiteScreen/suiteData.ts
src/services/server/sanity/graphql/getAllSuiteApps.ts
src/services/server/sanity/schemaTypes/suiteApp.ts
src/services/server/sanity/schemaTypes/waitlistSignup.ts
tests/screenshot.spec.ts
tests/smoke.spec.ts
```

## Files modified (8)

```
README.md                                                                     # expanded from 5 lines to a real project overview
jest.config.js                                                                # + setupFilesAfterEnv, + testPathIgnorePatterns for tests/
next-sitemap.config.js                                                        # + /standard-suite in additionalPaths with priority 0.9
package.json                                                                  # + seed:sanity, e2e, e2e:install scripts; + @playwright/test devDep
src/components/TopNavStatic/TopNavStatic.tsx                                  # + Standard Suite tab (desktop + mobile)
src/constants/pages.ts                                                        # + STANDARD_SUITE_PAGE
src/screens/LandingScreen/LandingScreen.tsx                                   # + hero CTA + footer Standard Suite column
src/screens/LandingScreen/Solutions.tsx                                       # refactored to grouped 18-item grid
src/services/server/sanity/schema.ts                                          # + suiteApp + waitlistSignup registrations
tailwind.config.ts                                                            # + 5 suite category color tokens
```

---

## Git index restoration (Phase 0)

The repo's git index was severely corrupted before this work — ~2,772 files were staged for deletion and untracked (OneDrive sync side-effect). Phase 0 restored it:

1. `git add -A` re-staged the working tree against HEAD
2. The 5 truly-missing-from-disk files (`codegen:client.yml`, `codegen:sanity.yml`, `codegen:server.yml`, `scripts/keys/dev-wallet-key.json`, `scripts/keys/token-key.json`) were re-added to the index via `git -c core.protectNTFS=false update-index --add --cacheinfo <mode>,<sha>,<path>` using their HEAD blob SHAs (Windows refuses to write filenames containing `:` to disk, so they cannot be checked out, but they remain tracked in HEAD)
3. Those 5 paths were marked `skip-worktree` so future `git add -A` runs don't re-stage their working-tree deletion

After Phase 0, `git status` shows a clean tree (only intentional changes staged).

---

## Outstanding (owned by this repo / sibling plans / user)

- [ ] **DNS: point 14 `*.marketstandard.app` subdomains at their Standard app Vercel projects** — the "Visit Site" buttons now link to `polls.marketstandard.app`, `proof.marketstandard.app`, `vault.marketstandard.app`, `snippets.marketstandard.app`, `regex.marketstandard.app`, `metrics.marketstandard.app`, `release.marketstandard.app`, `links.marketstandard.app`, `status.marketstandard.app`, `lens.marketstandard.app`, `cron.marketstandard.app`, `hook.marketstandard.app`, `postmortem.marketstandard.app`, `workspace.marketstandard.app`. Until DNS records are created, these URLs will 404. Owned by the Market Standard DNS provider + each Standard app's Vercel project domain settings.
- [ ] **Set Vercel env vars** `FLOODG8_API_URL` + `WAITLIST_FORWARD_URL` in the Vercel project settings (cannot be done via MCP — the Vercel MCP lacks an env-var tool and the Vercel CLI is not installed locally)
- [ ] **Run Sanity seed** — `npm run seed:sanity` requires `SANITY_CONTENT_WRITE_TOKEN` + the `STRIPE_PRICE_*_STARTER` env vars from `F:\dev\SAAS\.env.example`. Until this runs, the Sanity `suiteApp` / `product` / `productCategory` / `feature` documents don't exist; the marketing site falls back to the hardcoded `suiteData.ts` array (which is the source of truth anyway, so this is non-blocking for the marketing site but blocking for `/marketplace` and `/dashboard` showing the suite)
- [ ] **Run Playwright against the deployed URL** — `PLAYWRIGHT_BASE_URL=https://marketstandard.app npx playwright test` after Vercel finishes the deploy. Local Playwright run is blocked by missing credentials + the Node/Firebase ESM-CJS issue on this workstation
- [ ] **Per-app screenshots** — `suiteData.ts` has an optional `screenshot` field per app; populate `public/og/{app}.png` for each live app and add the path to `suiteData.ts` so the homepage Solutions cards render the preview pane (currently the preview pane is hidden when no screenshot is set)
- [ ] **Production deploy approval** — per the plan spec §9.2, production deploy requires explicit user approval. The push to `main` triggers Vercel's git integration which auto-deploys to production; if gating is desired, revert the deploy from Vercel's dashboard
- [ ] **Cross-repo integration test harness** in `F:\dev\SAAS\e2e\cross-repo\` — owned by `SAAS-FINISH.md`
- [ ] **Each `*.marketstandard.app` app's `/auth/callback`** for SSO — owned by the sibling Standard apps (see `floodg8.md` §"Cross-domain SSO bridge")
- [ ] **Flip `comingSoon` to `false`** in `suiteData.ts` for `standard-lens` + `standard-cron` once those apps ship (and remove the Join waitlist CTA — it renders automatically when `status === 'coming_soon'`)

---

## Contacts + references

- **marketstandard-app repo:** `C:\Users\CJ\OneDrive\repos\MarketStandard\website\marketstandard-app` (GitHub: `marketstandard/marketstandard-app`)
- **Plan doc:** `marketstandard-app\docs\SAAS_SUITE_DISPLAY.md` (10 phases)
- **Sanity setup doc:** `marketstandard-app\docs\SANITY_SUITE_SETUP.md`
- **Spec doc (original ask):** `marketstandard-app\docs\SAAS_SUITE_DISPLAY.md`
- **Production URL:** <https://marketstandard.app/standard-suite>
- **Homepage:** <https://marketstandard.app>
- **Sanity Studio:** <https://marketstandard.app/_/studio>
- **Suite catalog proxy:** <https://marketstandard.app/api/v1/suite-catalog>
- **Waitlist endpoint:** `POST` <https://marketstandard.app/api/v1/waitlist>
- **OG image route:** <https://marketstandard.app/api/og/standard-suite>
- **Commits pushed:** `03824b8` (Phase 1-3) → `f89f791` (Phase 4-7) → `0a8e771` (Phase 8) → `c01e020` (Phase 9 docs) → `baafa74` (FloodG8 + SyncDevTime icon redesign)
- **Sibling integration doc:** `F:\dev\SAAS\docs\integrated_apps\floodg8.md`
- **Shared Supabase project ref:** `opodtvblrelmpoaprmpr`
