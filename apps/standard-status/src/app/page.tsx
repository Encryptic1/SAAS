import { LocalDevBanner, MarketingLanding } from "@market-standard/ui";
import { fetchGateway, isLocalGatewayMode } from "@market-standard/db";
import { pipelines } from "@market-standard/db/schema/status";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let pipelineCount = 0;
  try {
    if (isLocalGatewayMode()) {
      const rows = await fetchGateway<{ pipelines: typeof pipelines.$inferSelect[] }>("/status/pipelines?ownerId=local-dev");
      pipelineCount = rows.pipelines?.length ?? 0;
    }
  } catch {
    // DB not ready
  }

  const dbHint = pipelineCount > 0 ? `Live data: ${pipelineCount} pipeline(s)` : undefined;

  return (
    <>
      <LocalDevBanner />
      <MarketingLanding
        product="standard-status"
        productLabel="Standard Status"
        eyebrow="Market Standard · build status"
        headline={
          <>
            One pane for <span className="ms-flood-text">build, CI, deploys, and incidents.</span>
          </>
        }
        lede="A build/CI status dashboard that unifies GitHub Actions, Vercel deployments, and the FloodG8 runner relay. See pipeline health, deploy history, and active incidents in one view — with a unified intake webhook so any source can report in."
        highlight={
          <>
            <strong className="text-[var(--color-flood)]">One intake webhook.</strong>{" "}
            POST a unified event from GitHub Actions, Vercel, or FloodG8 runners — pipelines, deployments, and incidents update in real time.
          </>
        }
        primaryCta={{ label: "Open Dashboard", href: "/dashboard" }}
        secondaryCta={{ label: "Add pipeline", href: "/dashboard" }}
        tertiaryCta={{ label: "See features", href: "#capabilities" }}
        stats={[
          { value: "GH · Vercel · FG8", label: "unified sources" },
          { value: "30-run", label: "success sparkline" },
          { value: "SEV1–4", label: "incident severity" },
        ]}
        missionTitle="Build status that doesn't make you switch tabs."
        missionBody="Standard Status pulls GitHub Actions workflow runs, Vercel deployments, and FloodG8 runner heartbeats into a single dashboard. A unified intake webhook accepts events from any source, so you can wire up custom CI in minutes. Incidents get severity, status, and a one-click resolve — and they cross-link to FloodG8 Postmortem so the timeline is already there when you write the retro."
        featuresTitle="Built to be the source of truth for deploys."
        features={[
          {
            title: "Unified intake webhook",
            body: "POST /api/intake with { source, event, ownerId, status, ... }. Map GitHub workflow_run → pipeline, Vercel deployment → deployment, FloodG8 runner → pipeline. Bearer auth via STATUS_INTAKE_SECRET.",
          },
          {
            title: "30-run sparkline",
            body: "Each pipeline shows the last 30 runs as a colored bar strip — green/amber/red. Spot flaky tests and degraded success rates at a glance.",
          },
          {
            title: "Deploy history per pipeline",
            body: "Every deployment is logged with environment, SHA, status, and URL. Click through to the deploy or roll back context in Standard Release.",
          },
          {
            title: "Incident feed with severity",
            body: "Declare SEV1–SEV4 incidents with status (investigating → identified → monitoring → resolved). One-click resolve stamps the timestamp.",
          },
          {
            title: "Cross-links to Hook + Release + Postmortem",
            body: "Failed webhook in Standard Hook? It can create an incident here. Shipped a fix? Link the deployment. Writing a retro? FloodG8 Postmortem pulls the incident timeline.",
          },
          {
            title: "SyncDevTime heartbeat",
            body: "Time spent triaging an incident is tracked via SyncDevTime heartbeat (incident_id sent in payload) — so you see the real cost of incidents.",
          },
        ]}
        stepsTitle="Wire up your first pipeline in 2 minutes."
        steps={[
          "Open the dashboard and click 'Add pipeline' (or hit /api/intake from your CI).",
          "Pick a source: GitHub Actions, Vercel, or FloodG8 runner.",
          "Optionally paste a repo full name for context.",
          "POST events to /api/intake as builds run — the sparkline fills in.",
          "Declare an incident when something breaks; resolve with one click when it's fixed.",
        ]}
        pricingTitle="Free to start. Pro when you need it."
        pricing={[
          { tier: "Free", price: "$0", limits: "3 pipelines · 1 user" },
          { tier: "Starter", price: "$19/mo", limits: "25 pipelines + auto-sync", highlight: true },
        ]}
        proofTitle="One pane for the whole CI/CD loop."
        proofPoints={[
          "Unified intake webhook (GH · Vercel · FG8)",
          "30-run sparkline per pipeline",
          "Incident feed with SEV1–4 + one-click resolve",
          "Cross-links to Hook, Release, and Postmortem",
        ]}
        dbHint={dbHint}
      />
    </>
  );
}
