/**
 * Phase 9: generate a /docs page per app that renders the shared DocsPage with
 * app-specific overview + getting-started content, an API endpoints section
 * derived from the app's openApiDoc, and a changelog. Run:
 *   pnpm exec tsx scripts/gen-docs-pages.ts
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

type App = { dir: string; product: string; productName: string; tagline: string; gettingStarted: string[] };

const APPS: App[] = [
  { dir: "standard-polls", product: "standard-polls", productName: "Standard Polls", tagline: "Run polls and stand-ups inside Slack.", gettingStarted: ["Install the Slack bot with /polls.", "Create a poll from the dashboard or Slack.", "Review analytics to track participation."] },
  { dir: "standard-proof", product: "standard-proof", productName: "Standard Proof", tagline: "Collect and publish customer testimonials.", gettingStarted: ["Create a collection.", "Add testimonials and pin the best.", "Publish your public wall."] },
  { dir: "standard-metrics", product: "standard-metrics", productName: "Standard Metrics", tagline: "Revenue analytics from Stripe.", gettingStarted: ["Connect Stripe on the settings page.", "Create payment links.", "Open analytics for MRR, churn, and LTV."] },
  { dir: "standard-hook", product: "standard-hook", productName: "Standard Hook", tagline: "Capture, inspect, and replay webhooks.", gettingStarted: ["Create an inbox to get a capture URL.", "POST events to the inbox slug.", "Replay events downstream."] },
  { dir: "standard-release", product: "standard-release", productName: "Standard Release", tagline: "Auto-draft release notes from commits.", gettingStarted: ["Add a GitHub repo.", "Generate release notes.", "Publish to your changelog."] },
  { dir: "standard-links", product: "standard-links", productName: "Standard Links", tagline: "Short links with click analytics.", gettingStarted: ["Create a short link.", "Share it.", "Review analytics for clicks and referrers."] },
  { dir: "standard-vault", product: "standard-vault", productName: "Standard Vault", tagline: "Encrypted secrets for projects.", gettingStarted: ["Create a project.", "Add secrets with envelope encryption.", "Mint a read-only token for CI."] },
  { dir: "standard-snippets", product: "standard-snippets", productName: "Standard Snippets", tagline: "Versioned, shareable code snippets.", gettingStarted: ["Create a snippet.", "Every save creates a version.", "Generate a shareable link."] },
  { dir: "standard-status", product: "standard-status", productName: "Standard Status", tagline: "Pipelines, deployments, and incidents.", gettingStarted: ["Create a pipeline.", "Log deployments.", "Open an incident when things break."] },
  { dir: "standard-regex", product: "standard-regex", productName: "Standard Regex", tagline: "Save, test, and share regex patterns.", gettingStarted: ["Create a pattern with tests.", "Browse public patterns.", "Fork a pattern to make it your own."] },
  { dir: "standard-postmortem", product: "standard-postmortem", productName: "Standard Postmortem", tagline: "Postmortems with action tracking + recurrence.", gettingStarted: ["Open an incident.", "Add a timeline and action items.", "Detect recurrence across incidents."] },
  { dir: "standard-lens", product: "standard-lens", productName: "Standard Lens", tagline: "Optimize slow database queries.", gettingStarted: ["Save your most-used queries.", "Paste an EXPLAIN plan for findings.", "Review the slow queries tab."] },
  { dir: "standard-cron", product: "standard-cron", productName: "Standard Cron", tagline: "Monitor cron jobs with heartbeats.", gettingStarted: ["Register a job and grab its heartbeat token.", "POST to /api/heartbeat/:token after each run.", "Inspect runs and drift."] },
  { dir: "standard-workspace", product: "standard-workspace", productName: "Standard Workspace", tagline: "Portfolio control panel: status grid, sessions, tunnels, depsync.", gettingStarted: ["Open the dashboard to see the 14-app status grid.", "Start a dev session and tail logs over SSE.", "Create a webhook tunnel for local intake routes.", "Run depsync to check package parity across apps."] },
];

function pageSource(app: App): string {
  const gettingStartedItems = app.gettingStarted.map((g) => `<li>${g}</li>`).join("");
  return `import { DocsPage } from "@market-standard/ui";
import { openApiDoc } from "@/lib/openapi";

export default function DocsPageRoute() {
  const endpoints = Object.entries(openApiDoc.paths).flatMap(([path, methods]) =>
    Object.entries(methods).map(([method, op]) => ({ method: method.toUpperCase(), path, summary: op.summary })),
  );

  return (
    <DocsPage
      product="${app.product}"
      productName="${app.productName}"
      tagline="${app.tagline}"
      sections={[
        {
          id: "overview",
          title: "Overview",
          body: <p>${app.productName} is part of the Market Standard suite. ${app.tagline} This page documents the product and its HTTP API.</p>,
        },
        {
          id: "getting-started",
          title: "Getting started",
          body: (
            <ul>
              ${gettingStartedItems}
            </ul>
          ),
        },
        {
          id: "api",
          title: "HTTP API",
          body: (
            <>
              <p>
                Every endpoint is documented interactively at{" "}
                <a href="/api/docs">/api/docs</a> (Swagger UI). The OpenAPI spec is
                available at <a href="/api/openapi.json">/api/openapi.json</a>.
              </p>
              <div className="ms-docs-endpoints">
                {endpoints.map((e) => (
                  <div key={e.method + e.path} className="ms-docs-endpoint">
                    <span className="ms-docs-method">{e.method}</span>
                    <span className="ms-docs-path">{e.path}</span>
                  </div>
                ))}
              </div>
            </>
          ),
        },
      ]}
      changelog={[
        {
          version: "1.0.0",
          date: "2026-06-28",
          notes: [
            "Public API documented with OpenAPI 3.0 + Swagger UI at /api/docs.",
            "Notification center + team/RBAC added across the suite.",
            "First-run onboarding tour added to every dashboard.",
          ],
        },
      ]}
      loomVideos={[
        { id: "overview", title: "${app.productName} — product overview", src: "" },
        { id: "api", title: "Using the HTTP API + SDK", src: "" },
      ]}
    />
  );
}
`;
}

async function writeIfChanged(path: string, content: string): Promise<boolean> {
  let prev: string | null = null;
  try {
    prev = await readFile(path, "utf8");
  } catch {
    /* missing */
  }
  if (prev === content) return false;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
  return true;
}

async function main() {
  let written = 0;
  for (const app of APPS) {
    const path = join("apps", app.dir, "src", "app", "docs", "page.tsx");
    if (await writeIfChanged(path, pageSource(app))) written++;
  }
  console.log(`Phase 9 docs: wrote ${written} /docs pages across ${APPS.length} apps.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
