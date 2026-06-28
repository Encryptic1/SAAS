import { LocalDevBanner, MarketingLanding } from "@market-standard/ui";
import { fetchGateway, isLocalGatewayMode } from "@market-standard/db";
import { jobs } from "@market-standard/db/schema/cron";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let jobCount = 0;
  try {
    if (isLocalGatewayMode()) {
      const rows = await fetchGateway<{ jobs: typeof jobs.$inferSelect[] }>("/cron/jobs?ownerId=local-dev");
      jobCount = rows.jobs?.length ?? 0;
    }
  } catch {
    // DB not ready
  }
  const dbHint = jobCount > 0 ? `Live data: ${jobCount} monitored job(s)` : undefined;

  return (
    <>
      <LocalDevBanner />
      <MarketingLanding
        product="standard-cron"
        productLabel="Standard Cron"
        eyebrow="Market Standard · reliability"
        headline={
          <>
            Know your cron missed <span className="ms-flood-text">before users do.</span>
          </>
        }
        lede="A cron monitor for Vercel Cron, GitHub Actions, and FloodG8 runners. Each job gets a heartbeat URL — ping it when the job runs. If a window is missed, Standard Cron alerts Slack and Suite Pulse with the run history and last-known status."
        highlight={
          <>
            <strong className="text-[var(--color-flood)]">Heartbeat-based, not log-scraping.</strong>{" "}
            Your job pings a URL on each run — no agent, no log shipping. A missed window (schedule + grace) triggers Slack + Pulse so you hear about it first.
          </>
        }
        primaryCta={{ label: "Open Dashboard", href: "/dashboard" }}
        secondaryCta={{ label: "View docs", href: "/dashboard" }}
        stats={[
          { value: "5-field", label: "cron parser" },
          { value: "Slack", label: "missed-run alerts" },
          { value: "30-day", label: "run history" },
        ]}
        missionTitle="Cron monitoring that fits any runner."
        missionBody="Standard Cron is a heartbeat-based cron monitor. Register a job with its 5-field cron schedule and expected window; the app mints a per-job heartbeat URL. Your job curls that URL at the start (and optionally the end) of each run. If no heartbeat arrives within the schedule window plus a grace period, Standard Cron marks the run missed and alerts Slack and Suite Pulse. Run history is retained per job so you can spot flaky schedules and failures. Deep-link into Standard Hook (failed webhook → cron blame), Standard Status (CI pane), and Standard Vault (token storage)."
        featuresTitle="Built for the workflow you already have."
        features={[
          {
            title: "Heartbeat URL per job",
            body: "Each job gets a unique, unguessable token URL. Ping it from Vercel Cron, GitHub Actions, or a FloodG8 runner — no agent, no log shipping.",
          },
          {
            title: "5-field cron parser",
            body: "Register schedules with standard minute hour day month weekday syntax. The parser validates the expression and renders a human-readable summary.",
          },
          {
            title: "Missed-run detection",
            body: "The schedule window plus a configurable grace period defines 'missed'. No heartbeat in time → the run is marked missed and an alert fires.",
          },
          {
            title: "Slack + Pulse alerts",
            body: "Route alerts to a Slack channel or Suite Pulse. Failed and missed runs both alert so you can triage before users file tickets.",
          },
          {
            title: "Run history",
            body: "Every heartbeat records a run row with status, start time, and duration. The job detail page shows the last 30 runs so flaky schedules are obvious.",
          },
          {
            title: "Hook + Status synergy",
            body: "Deep-link into Standard Hook to debug the webhook that was supposed to fire the cron, and Standard Status to see the CI pane alongside cron health.",
          },
        ]}
        stepsTitle="Monitor your first cron job in 60 seconds."
        steps={[
          "Open the dashboard and click 'New job'.",
          "Name it, paste the 5-field cron schedule, pick a source.",
          "Set the expected window and grace minutes.",
          "Copy the heartbeat URL into your Vercel Cron / GitHub Action / runner.",
          "Watch run history populate — missed windows alert Slack + Pulse.",
        ]}
        pricingTitle="Free to start. Pro when you need it."
        pricing={[
          { tier: "Free", price: "$0", limits: "3 jobs + 7-day history" },
          { tier: "Starter", price: "$19/mo", limits: "25 jobs + 30-day history", highlight: true },
          { tier: "Growth", price: "$49/mo", limits: "unlimited jobs + full history + Slack" },
        ]}
        proofTitle="Missed runs you hear about first."
        proofPoints={[
          "Heartbeat URL per job (no agent needed)",
          "5-field cron parser + schedule summary",
          "Missed-run detection with configurable grace",
          "Slack + Suite Pulse alerts + Hook/Status deep links",
        ]}
        dbHint={dbHint}
      />
    </>
  );
}
