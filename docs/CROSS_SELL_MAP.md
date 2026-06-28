# Cross-Sell Map — Market Standard SAAS

Every cross-sell deep link carries a `source=` query param so the target app can pre-fill its intake form. This document is the source of truth for all wired deep links.

## Deep-link index

| # | From | To | Trigger | URL pattern | Pre-fill |
|---|------|----|---------|-------------|----------|
| 1 | Standard Hook | Standard Postmortem | Event detail → "Create postmortem" | `/dashboard/new?source=hook&event_id={id}&inbox_slug={slug}` | title, summary, timeline |
| 2 | Standard Status | Standard Postmortem | Failed pipeline → "Create postmortem" | `/dashboard/new?source=status&pipeline_id={id}&pipeline_name={name}` | title, summary |
| 3 | Standard Status | Standard Release | Failed pipeline → "Release notes" | `/dashboard?repo={repo}&source=status` | repo filter |
| 4 | Standard Status | Standard Hook | Failed pipeline → "Debug in Hook" | `/dashboard/inboxes?source=status&pipeline_id={id}&pipeline_name={name}` | — |
| 5 | Suite Pulse | Standard Postmortem | Standup blocker keyword | `/dashboard/new?source=pulse&blocker_text={text}` | title, root-cause template |
| 6 | Standard Regex | Standard Hook | Editor → "Save as Hook filter" | `/dashboard/inboxes?source=regex&pattern={pattern}` | — |
| 7 | Standard Regex | Standard Snippets | Editor → "Save as Snippet" | `/dashboard/new?source=regex&code={pattern}&language=regex&title={name}` | title, body, language, tags |
| 8 | Standard Snippets | FloodG8 Plan Editor | `[[snippet:{id}]]` reference | `GET /api/snippets/{id}/resolve` | latest version body |
| 9 | Standard Vault | All apps | `ms-vault run` CLI shim | `GET /api/projects/{id}/inject` | masked secret map |
| 10 | Standard Metrics | Standard Links | Dashboard → "Track payment-link clicks" | `/dashboard?source=metrics` | — |
| 11 | Standard Links | Standard Metrics | Dashboard → MetricsCrossSellWidget | (widget renders in-app) | click counts |

## Universal suite switcher

Every dashboard renders `SuiteSwitcher` (in `DashboardShell`) which lists all sibling apps and deep-links to their dashboards. Sibling URLs are defined in `packages/ui/src/marketing/portfolio-urls.ts`.

## Viral loop

Free-tier artifacts carry a `PoweredByBadge`:
- Standard Polls: footer on every Slack poll message
- Standard Proof: badge on every embed widget
- Standard Links: interstitial on short-link redirects
- Standard Snippets: badge on public `/s/{slug}` share pages

Each badge impression is organic distribution to viewers outside the paying team.

## Verification

E2E specs in `e2e/cross-sell.spec.ts` validate the pre-fill behavior for Hook → Postmortem, Status → Postmortem, Pulse → Postmortem, and Regex → Snippets deep links.

## Future cross-sells (Phase 6+)

- Standard Lens → Standard Hook (slow query → webhook debug)
- Standard Cron → Standard Status (missed cron → incident)
- Standard Workspace → Standard Status / Snippets / Vault / Pulse
