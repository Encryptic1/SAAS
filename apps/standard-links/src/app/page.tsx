import { LocalDevBanner, MarketingLanding } from "@market-standard/ui";
import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { linkRecords } from "@market-standard/db/schema/links";
import { count, desc, eq } from "@market-standard/db/query";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let linkCount = 0;
  let clickCount = 0;

  try {
    if (isLocalGatewayMode()) {
      const rows = await fetchGateway<typeof linkRecords.$inferSelect[]>("/links/links");
      linkCount = rows.length;
      clickCount = rows.reduce((acc, r) => acc + r.clickCount, 0);
    } else {
      const db = await getDbAsync();
      const [r] = await db.select({ count: count() }).from(linkRecords);
      linkCount = r?.count ?? 0;
    }
  } catch {
    // DB not ready
  }

  const dbHint =
    linkCount > 0 || clickCount > 0
      ? `Live data: ${linkCount} link(s), ${clickCount} tracked click(s)`
      : undefined;

  return (
    <>
      <LocalDevBanner />
      <MarketingLanding
        product="standard-links"
        productLabel="Standard Links"
        eyebrow="Market Standard · payment links"
        headline={
          <>
            Brand and track every <span className="ms-flood-text">Stripe payment link.</span>
          </>
        }
        lede="Paste a Stripe payment link URL, get a branded short link with click tracking, UTM passthrough, and one-click attribution to Standard Metrics."
        highlight={
          <>
            <strong className="text-[var(--color-flood)]">Shorten. Brand. Measure.</strong>{" "}
            Every share gets a /go/&lt;slug&gt; URL that records the click before redirecting.
          </>
        }
        primaryCta={{ label: "Open Dashboard", href: "/dashboard" }}
        secondaryCta={{ label: "Add a link", href: "/dashboard/links" }}
        tertiaryCta={{ label: "See features", href: "#capabilities" }}
        stats={[
          { value: "Stripe", label: "payment links" },
          { value: "Clicks", label: "tracked + counted" },
          { value: "UTM", label: "passthrough" },
        ]}
        missionTitle="Payment links, instrumented."
        missionBody="Standard Links wraps any Stripe payment link URL in a branded short link that records every click with referrer, user-agent, and UTM metadata — then pipes the data into Standard Metrics for conversion attribution."
        featuresTitle="From share to conversion."
        features={[
          {
            title: "Branded short links",
            body: "Replace buy.stripe.com/... with yourdomain.com/go/pro-annual.",
          },
          {
            title: "Click tracking",
            body: "Every redirect increments a click counter and records a click event with metadata.",
          },
          {
            title: "UTM passthrough",
            body: "utm_source, utm_medium, utm_campaign flow through to your Stripe checkout.",
          },
          {
            title: "Pause & resume",
            body: "Toggle a link inactive without deleting it — visitors see a friendly pause page.",
          },
          {
            title: "Metrics cross-sell",
            body: "One click opens Standard Metrics with your connected Stripe account ready to attribute.",
          },
          {
            title: "Local dev gateway",
            body: "Full workflow works offline with the Market Standard DB gateway.",
          },
        ]}
        stepsTitle="Track your first link in 60 seconds."
        steps={[
          "Paste a Stripe payment link URL.",
          "Get a branded short link at /go/<slug>.",
          "Share the short link anywhere.",
          "Watch clicks accumulate in real-time.",
          "Open Standard Metrics to attribute clicks to MRR.",
        ]}
        pricingTitle="Free to start. Unlimited when you need it."
        pricing={[
          { tier: "Free", price: "$0", limits: "3 links · click tracking" },
          { tier: "Starter", price: "$19/mo", limits: "Unlimited links · UTM passthrough", highlight: true },
        ]}
        proofTitle="Clicks that lead somewhere."
        proofPoints={[
          "Every redirect logged with metadata",
          "UTM params preserved end-to-end",
          "Cross-sell into Standard Metrics",
          "Gateway mode for local development",
        ]}
        dbHint={dbHint}
      />
    </>
  );
}
