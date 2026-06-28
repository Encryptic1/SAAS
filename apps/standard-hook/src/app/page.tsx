import { LocalDevBanner, MarketingLanding } from "@market-standard/ui";
import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { webhookEvents, webhookInboxes } from "@market-standard/db/schema/hook";
import { count } from "@market-standard/db/query";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let inboxCount = 0;
  let eventCount = 0;

  try {
    if (isLocalGatewayMode()) {
      const rows = await fetchGateway<Array<{ id: string }>>("/hook/inboxes");
      inboxCount = rows.length;
      for (const row of rows) {
        const detail = await fetchGateway<{ events: unknown[] }>(`/hook/inboxes/${row.id}`).catch(
          () => null,
        );
        eventCount += detail?.events.length ?? 0;
      }
    } else {
      const db = await getDbAsync();
      const [i] = await db.select({ count: count() }).from(webhookInboxes);
      const [e] = await db.select({ count: count() }).from(webhookEvents);
      inboxCount = i?.count ?? 0;
      eventCount = e?.count ?? 0;
    }
  } catch {
    // DB not ready
  }

  const dbHint =
    inboxCount > 0 || eventCount > 0
      ? `Live data: ${inboxCount} inbox${inboxCount === 1 ? "" : "es"}, ${eventCount} event${eventCount === 1 ? "" : "s"}`
      : undefined;

  return (
    <>
      <LocalDevBanner />
      <MarketingLanding
        product="standard-hook"
        productLabel="Standard Hook"
        eyebrow="Market Standard · webhook inbox"
        headline={
          <>
            Catch every webhook,{" "}
            <span className="ms-flood-text">replay on demand.</span>
          </>
        }
        lede="Spin up a unique capture URL for Stripe, GitHub, or any service. Inspect headers and payloads in real time, then replay events to your local dev server."
        highlight={
          <>
            <strong className="text-[var(--color-flood)]">Built for integration debugging.</strong>{" "}
            No tunnel gymnastics — just point webhooks at your inbox.
          </>
        }
        primaryCta={{ label: "Open Dashboard", href: "/dashboard" }}
        secondaryCta={{ label: "Create inbox", href: "/dashboard/inboxes" }}
        tertiaryCta={{ label: "See features", href: "#capabilities" }}
        stats={[
          { value: "1 URL", label: "per inbox" },
          { value: "Replay", label: "any event" },
          { value: "JSON", label: "body storage" },
        ]}
        missionTitle="Webhooks you can actually debug."
        missionBody="Standard Hook gives developers a persistent inbox for inbound webhooks. Capture payloads, inspect headers, and replay to localhost or staging — without losing events between restarts."
        featuresTitle="From capture to replay in seconds."
        features={[
          {
            title: "Unique capture URLs",
            body: "Each inbox gets a public /api/capture/{slug} endpoint that accepts any HTTP method.",
          },
          {
            title: "Full request capture",
            body: "Headers, query params, and raw body stored for every inbound request.",
          },
          {
            title: "Event replay",
            body: "Resend any captured event to your dev server with one click.",
          },
          {
            title: "Dashboard inbox",
            body: "Browse events chronologically with readable headers and body display.",
          },
          {
            title: "Local dev gateway",
            body: "Works with the Market Standard local DB gateway for offline development.",
          },
          {
            title: "Stripe-ready",
            body: "Point Stripe test webhooks at your inbox during checkout integration work.",
          },
        ]}
        stepsTitle="Debug webhooks this afternoon."
        steps={[
          "Create an inbox and copy the capture URL.",
          "Point your webhook provider at /api/capture/{slug}.",
          "Watch events arrive in the dashboard.",
          "Replay payloads to your local handler.",
          "Upgrade for more inboxes and higher event limits.",
        ]}
        pricingTitle="Free to start. Scale when you ship."
        pricing={[
          { tier: "Free", price: "$0", limits: "1 inbox · 100 events/mo" },
          { tier: "Starter", price: "$9/mo", limits: "5 inboxes · 10k events/mo", highlight: true },
        ]}
        proofTitle="Developer workflow, productized."
        proofPoints={[
          "Capture URL works with any HTTP method",
          "Replay sends original method, headers, and body",
          "Gateway mode for zero-config local dev",
          "Event retention for debugging sessions",
        ]}
        dbHint={dbHint}
      />
    </>
  );
}
