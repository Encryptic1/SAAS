import { LocalDevBanner, MarketingLanding } from "@market-standard/ui";
import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { collections, testimonials } from "@market-standard/db/schema/proof";
import { count } from "@market-standard/db/query";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let collectionCount = 0;
  let testimonialCount = 0;

  try {
    if (isLocalGatewayMode()) {
      const rows = await fetchGateway<Array<{ id: string }>>("/proof/collections");
      collectionCount = rows.length;
      const demo = await fetchGateway<{ testimonials: unknown[] }>("/proof/collections/demo");
      testimonialCount = demo.testimonials.length;
    } else {
      const db = await getDbAsync();
      const [c] = await db.select({ count: count() }).from(collections);
      const [t] = await db.select({ count: count() }).from(testimonials);
      collectionCount = c?.count ?? 0;
      testimonialCount = t?.count ?? 0;
    }
  } catch {
    // DB not ready
  }

  const dbHint =
    collectionCount > 0 || testimonialCount > 0
      ? `Live data: ${collectionCount} collection${collectionCount === 1 ? "" : "s"}, ${testimonialCount} testimonial${testimonialCount === 1 ? "" : "s"}`
      : undefined;

  return (
    <>
      <LocalDevBanner />
      <MarketingLanding
        product="standard-proof"
        productLabel="Standard Proof"
        eyebrow="Market Standard · social proof"
        headline={
          <>
            Your customers&apos; words,{" "}
            <span className="ms-flood-text">
              on every page.
            </span>
          </>
        }
        lede="Collect testimonials, approve them in a dashboard, and embed a Wall of Love on Webflow, Framer, WordPress, or any HTML site. Every visitor sees your social proof — and our badge."
        highlight={
          <>
            <strong className="text-[var(--color-flood)]">Broadest exposure in the portfolio.</strong> One embed puts
            your brand in front of your customer&apos;s entire audience.
          </>
        }
        primaryCta={{ label: "Open Dashboard", href: "/dashboard" }}
        secondaryCta={{ label: "View demo wall", href: "/c/demo" }}
        tertiaryCta={{ label: "See features", href: "#capabilities" }}
        stats={[
          { value: "1-line", label: "embed install" },
          { value: "ISR", label: "cached widgets" },
          { value: "SEO", label: "public pages" },
        ]}
        missionTitle="Social proof that markets itself."
        missionBody="Standard Proof turns customer love into a living marketing asset. Collect testimonials once, approve what ships, and embed a beautiful Wall of Love that loads fast at the edge — with a powered-by badge that drives discovery."
        featuresTitle="From collection to embed in minutes."
        features={[
          {
            title: "Testimonial collections",
            body: "Organize quotes by product, campaign, or landing page. Each collection gets a shareable public URL.",
          },
          {
            title: "One-line embed",
            body: "Drop a script tag and data attribute on any site. No framework lock-in, no marketplace gate.",
          },
          {
            title: "Approval workflow",
            body: "Review submissions before they go live. Feature your best quotes on the Wall of Love.",
          },
          {
            title: "Powered-by exposure",
            body: "Every embed and public page carries a Market Standard badge — your customers' traffic becomes your marketing.",
          },
          {
            title: "Edge-cached delivery",
            body: "Public pages and embed routes use ISR so widgets stay fast without hammering your database.",
          },
          {
            title: "Webflow & Framer ready",
            body: "Paste embed code into custom code blocks. Works anywhere HTML and JavaScript run.",
          },
        ]}
        stepsTitle="Launch a Wall of Love this afternoon."
        steps={[
          "Create a collection and share the testimonial form link.",
          "Approve the best quotes in your dashboard.",
          "Copy the embed snippet for your site or landing page.",
          "Publish — visitors see social proof with a subtle powered-by badge.",
          "Upgrade to remove the badge when branding matters more than discovery.",
        ]}
        pricingTitle="Free to start. Pay to own your brand."
        pricing={[
          { tier: "Free", price: "$0", limits: "1 collection · 10 testimonials · badge required" },
          { tier: "Starter", price: "$19/mo", limits: "3 collections · 50 testimonials · removable badge", highlight: true },
          { tier: "Growth", price: "$49/mo", limits: "Unlimited collections & testimonials · removable badge" },
        ]}
        proofTitle="The portfolio's widest reach."
        proofPoints={[
          "Badge impressions on every visitor to your customers' sites",
          "Indexable public collection pages at /c/{slug}",
          "Embed script loads tracked for install metrics",
          "Badge removal is the primary paid upsell — high intent",
        ]}
        dbHint={dbHint}
      />
    </>
  );
}
