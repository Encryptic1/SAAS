import { LocalDevBanner, MarketingLanding } from "@market-standard/ui";
import { fetchGateway, isLocalGatewayMode } from "@market-standard/db";
import { queries } from "@market-standard/db/schema/lens";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let queryCount = 0;
  try {
    if (isLocalGatewayMode()) {
      const rows = await fetchGateway<{ queries: typeof queries.$inferSelect[] }>("/lens/queries?ownerId=local-dev");
      queryCount = rows.queries?.length ?? 0;
    }
  } catch {
    // DB not ready
  }
  const dbHint = queryCount > 0 ? `Live data: ${queryCount} saved query(s)` : undefined;

  return (
    <>
      <LocalDevBanner />
      <MarketingLanding
        product="standard-lens"
        productLabel="Standard Lens"
        eyebrow="Market Standard · postgres"
        headline={
          <>
            Catch slow queries <span className="ms-flood-text">before production does.</span>
          </>
        }
        lede="A DB query optimizer with an EXPLAIN visualizer, a heuristic query scorer, and configurable slow-query alerting. Paste a query, see the plan, get concrete recommendations — then wire duration thresholds to Slack and Suite Pulse."
        highlight={
          <>
            <strong className="text-[var(--color-flood)]">A query scorer, not just an EXPLAIN viewer.</strong>{" "}
            Every query gets a 0–100 score with anti-pattern detection: SELECT *, full scans, function-on-column, NOT IN, unconstrained joins, unbounded sorts.
          </>
        }
        primaryCta={{ label: "Open Dashboard", href: "/dashboard" }}
        secondaryCta={{ label: "Slow queries", href: "/dashboard/slow" }}
        tertiaryCta={{ label: "EXPLAIN a query", href: "/dashboard/explain" }}
        stats={[
          { value: "0–100", label: "query score" },
          { value: "EXPLAIN", label: "plan visualizer" },
          { value: "Slack", label: "slow-query alerts" },
        ]}
        missionTitle="Query optimization that fits the dev loop."
        missionBody="Standard Lens is a DB query optimizer with an EXPLAIN plan visualizer and a heuristic query scorer. Paste a SQL query and the analyzer flags anti-patterns — SELECT *, full table scans, functions on indexed columns, NOT IN, unconstrained joins, unbounded sorts — and emits a 0–100 score plus concrete recommendations. Save queries to your library with tags and pin the hot ones. A configurable slow-query detector records anything over your threshold and alerts via Slack or Suite Pulse. Deep-link into Standard Vault for the connection string and Standard Hook for webhook payload regex."
        featuresTitle="Built for the workflow you already have."
        features={[
          {
            title: "Query score + findings",
            body: "Every query gets a 0–100 score with severity-tagged findings. High-severity issues (full scans, unconstrained joins) sink the score fastest so you know where to focus.",
          },
          {
            title: "EXPLAIN plan visualizer",
            body: "The plan tree is rendered as a nested list with node type, relation, row estimate, and cost — so you can see Seq Scan vs Index Scan at a glance.",
          },
          {
            title: "Slow query detection",
            body: "Set a duration threshold per database. Anything over it is captured with the SQL text, duration, and source, then surfaced on the slow-queries dashboard.",
          },
          {
            title: "Configurable alerts",
            body: "Route slow-query and missed-cron alerts to a Slack channel or Suite Pulse. Thresholds are per-database so you can tune noise vs signal.",
          },
          {
            title: "Saved query library",
            body: "Save queries with tags and pin the hot ones. Re-run the analyzer after a schema migration to confirm the score improved before deploying.",
          },
          {
            title: "Vault + Hook synergy",
            body: "Deep-link into Standard Vault for the database connection string (agent-reference mode), and Standard Hook to test webhook payload regex against captured events.",
          },
        ]}
        stepsTitle="Score your first query in 30 seconds."
        steps={[
          "Open the dashboard and click 'New query'.",
          "Paste your SQL and pick a database label.",
          "Run the analyzer — see the score, findings, and plan tree.",
          "Apply the recommendations and re-run to confirm the score climbed.",
          "Save it to your library, pin the hot ones, set a slow-query threshold.",
        ]}
        pricingTitle="Free to start. Pro when you need it."
        pricing={[
          { tier: "Free", price: "$0", limits: "100 queries/day + 7-day slow history" },
          { tier: "Starter", price: "$29/mo", limits: "unlimited queries + 30-day history", highlight: true },
          { tier: "Growth", price: "$99/mo", limits: "unlimited + full history + Slack alerts" },
        ]}
        proofTitle="Slow queries you catch before users do."
        proofPoints={[
          "0–100 query score with anti-pattern detection",
          "EXPLAIN plan tree visualizer",
          "Configurable slow-query threshold + Slack alerts",
          "Saved query library + Vault/Hook deep links",
        ]}
        dbHint={dbHint}
      />
    </>
  );
}
