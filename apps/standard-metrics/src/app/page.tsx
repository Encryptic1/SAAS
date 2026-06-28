import { LocalDevBanner, MarketingLanding } from "@market-standard/ui";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const isLocal = process.env.NEXT_PUBLIC_LOCAL_DEV === "true";
  const connectUrl = isLocal ? "/dashboard?connected=true" : "/api/stripe/connect";

  return (
    <>
      <LocalDevBanner />
      <MarketingLanding
        product="standard-metrics"
        productLabel="Standard Metrics"
        eyebrow="Market Standard · Stripe analytics"
        headline={
          <>
            MRR, churn, and LTV —{" "}
            <span className="ms-flood-text">
              without the spreadsheet.
            </span>
          </>
        }
        lede="Connect your Stripe account with read-only OAuth and get a clean dashboard for MRR, ARR, churn, LTV, and active subscriptions. Pre-computed daily — no live API calls on page load."
        highlight={
          <>
            <strong className="text-[var(--color-flood)]">Highest ARPU in the portfolio.</strong> Stripe merchants
            already pay for analytics — we meet them where they are.
          </>
        }
        primaryCta={{
          label: isLocal ? "Open Demo Dashboard" : "Connect with Stripe",
          href: connectUrl,
        }}
        secondaryCta={{ label: "See pricing", href: "#capabilities" }}
        stats={[
          { value: "1-click", label: "Stripe OAuth" },
          { value: "Daily", label: "metric sync" },
          { value: "$29+", label: "starter ARPU" },
        ]}
        missionTitle="Subscription metrics that respect your time."
        missionBody="Standard Metrics exists because Stripe's dashboard is built for operations — not for founders who need a single view of MRR health. We sync once per day, store snapshots, and serve a fast dashboard so you always know where revenue stands."
        featuresTitle="Analytics built for Stripe-native businesses."
        features={[
          {
            title: "Read-only Stripe Connect",
            body: "OAuth in one click. We never modify subscriptions, invoices, or customer data.",
          },
          {
            title: "Pre-computed snapshots",
            body: "Daily cron syncs aggregate MRR, ARR, churn, and LTV into fast-read tables — no Stripe rate limits on dashboard load.",
          },
          {
            title: "Core SaaS metrics",
            body: "MRR, ARR, churn rate, LTV, and active subscription count on one screen.",
          },
          {
            title: "History tiers",
            body: "Free gets 30 days. Starter unlocks a year. Growth adds unlimited history and segment breakdown.",
          },
          {
            title: "ISR-cached dashboard",
            body: "Pages revalidate every five minutes — snappy reads without hammering the database.",
          },
          {
            title: "Marketplace path",
            body: "Launch standalone OAuth first, then list on Stripe App Marketplace for organic discovery.",
          },
        ]}
        stepsTitle="From connect to clarity in one session."
        steps={[
          "Click Connect with Stripe and authorize read-only access.",
          "We pull subscription data on a daily schedule via background sync.",
          "Open your dashboard for MRR, churn, LTV, and active subs.",
          "Track trends over time as snapshots accumulate.",
          "Upgrade for longer history and segment breakdown on Growth.",
        ]}
        pricingTitle="Priced for serious merchants."
        pricing={[
          { tier: "Free", price: "$0", limits: "30-day history · core metrics" },
          { tier: "Starter", price: "$29/mo", limits: "1-year history · daily sync", highlight: true },
          { tier: "Growth", price: "$79/mo", limits: "Unlimited history · segment breakdown" },
        ]}
        proofTitle="Built for B2B retention."
        proofPoints={[
          "Stripe App Marketplace discovery path (future listing)",
          "Daily sync respects Stripe rate limits with backoff",
          "No real-time overhead — snapshots are enough for MRR decisions",
          "Target LTV $1,000–$2,000 at sub-4% monthly churn",
        ]}
        dbHint={isLocal ? "Local dev: seeded PGlite metrics on dashboard" : undefined}
      />
    </>
  );
}
