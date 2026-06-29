import { LocalDevBanner, MarketingLanding } from "@market-standard/ui";
import { isLocalGatewayMode } from "@market-standard/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let sessionCount = 0;
  try {
    if (isLocalGatewayMode()) {
      const rows = await fetch("http://127.0.0.1:4000/workspace/sessions?ownerId=local-dev").then((r) => r.json() as Promise<{ sessions: unknown[] }>).catch(() => ({ sessions: [] }));
      sessionCount = rows.sessions?.length ?? 0;
    }
  } catch {
    // DB not ready
  }

  const dbHint = sessionCount > 0 ? `Live data: ${sessionCount} session(s)` : undefined;

  return (
    <>
      <LocalDevBanner />
      <MarketingLanding
        product="standard-workspace"
        productLabel="Standard Workspace"
        eyebrow="Market Standard · portfolio control panel"
        headline={
          <>
            One pane for the <span className="ms-flood-text">whole Market Standard suite.</span>
          </>
        }
        lede="A portfolio control panel that shows live health for all 14 Market Standard apps plus FloodG8, SyncDevTime, Supabase, and Stripe. Start dev sessions, tail logs over SSE, manage webhook tunnels, and track dependency parity across repos."
        highlight={
          <>
            <strong className="text-[var(--color-flood)]">14-app status grid.</strong>{" "}
            See every app's /api/health, every external dependency, and every active dev session in one view — with SSE log tailing so you never alt-tab again.
          </>
        }
        primaryCta={{ label: "Open Dashboard", href: "/dashboard" }}
        secondaryCta={{ label: "Start a session", href: "/dashboard/sessions" }}
        tertiaryCta={{ label: "See features", href: "#capabilities" }}
        stats={[
          { value: "14", label: "apps + externals" },
          { value: "SSE", label: "live log tail" },
          { value: "parity", label: "depsync diff" },
        ]}
        missionTitle="The suite, finally in one window."
        missionBody="Standard Workspace is the control panel for the Market Standard portfolio. It pings every app's /api/health, polls FloodG8 / SyncDevTime / Supabase / Stripe, and renders a single status grid. Start an ms-suite dev session and tail its logs over Server-Sent Events. Spin up a Cloudflare Tunnel so external webhooks reach your local Hook / Status / Postmortem intake. Run depsync to see which repos are behind on the shared packages."
        featuresTitle="Built to be the home base."
        features={[
          {
            title: "14-app status grid",
            body: "Live /api/health for all 14 apps + FloodG8 + SyncDevTime + Supabase + Stripe. Green/amber/red with latency. Click through to any app's dashboard.",
          },
          {
            title: "Dev sessions with SSE logs",
            body: "POST /api/sessions to start an ms-suite dev session. Tail logs over /api/sessions/[id]/logs via Server-Sent Events — no more juggling 14 terminals.",
          },
          {
            title: "Webhook tunnels",
            body: "Spin up a Cloudflare Tunnel (or localhost proxy) so Stripe / Slack / GitHub webhooks reach your local Hook, Status, or Postmortem intake. One click to activate.",
          },
          {
            title: "Health-check history",
            body: "Every probe is stored. Open /dashboard/health to see latency trends and downtime windows for any target, charted over time.",
          },
          {
            title: "Depsync parity diff",
            body: "Run /api/depsync to compare @market-standard/* package versions across all 14 apps. Spot the app that's behind on @market-standard/ui before it bites.",
          },
          {
            title: "Cross-links to Status, Snippets, Vault, Pulse",
            body: "Jump to Standard Status for build health, Standard Snippets for runbook snippets, Standard Vault for shared secrets, or Pulse for the suite digest.",
          },
        ]}
        stepsTitle="Wire up your portfolio in 2 minutes."
        steps={[
          "Open the dashboard — the 14-app status grid loads automatically.",
          "Click 'Start session' to launch an ms-suite dev session (or hit POST /api/sessions).",
          "Tail logs live over SSE at /dashboard/sessions.",
          "Need inbound webhooks? Create a tunnel under /dashboard/tunnels.",
          "Run depsync to verify every app is on the latest shared packages.",
        ]}
        pricingTitle="Free to start. Pro when you need it."
        pricing={[
          { tier: "Free", price: "$0", limits: "1 user · 1 session" },
          { tier: "Starter", price: "$9/mo", limits: "5 sessions + tunnels", highlight: true },
          { tier: "Growth", price: "$29/mo", limits: "unlimited + team" },
        ]}
        proofTitle="The suite, finally in one window."
        proofPoints={[
          "14-app status grid (14 apps + FloodG8 + SyncDevTime + Supabase + Stripe)",
          "Dev sessions with SSE log tailing",
          "Webhook tunnels (Cloudflare / localhost)",
          "Depsync parity diff across all apps",
        ]}
        dbHint={dbHint}
      />
    </>
  );
}
