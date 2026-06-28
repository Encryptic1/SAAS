import type { MarketingFaqItem, MarketingLandingProps, MarketingProduct } from "./marketing-landing";

interface ComparisonBlock extends NonNullable<MarketingLandingProps["comparison"]> {}

interface RichContent {
  faq: MarketingFaqItem[];
  comparison: ComparisonBlock;
  jsonLd: Record<string, unknown>[];
}

const APP_URLS: Record<MarketingProduct, string> = {
  "standard-polls": "https://polls.marketstandard.app",
  "standard-proof": "https://proof.marketstandard.app",
  "standard-metrics": "https://metrics.marketstandard.app",
  "standard-hook": "https://hook.marketstandard.app",
  "standard-release": "https://release.marketstandard.app",
  "standard-links": "https://links.marketstandard.app",
  "standard-vault": "https://vault.marketstandard.app",
  "standard-lens": "https://lens.marketstandard.app",
  "standard-cron": "https://cron.marketstandard.app",
  "standard-workspace": "https://workspace.marketstandard.app",
  "standard-snippets": "https://snippets.marketstandard.app",
  "standard-status": "https://status.marketstandard.app",
  "standard-regex": "https://regex.marketstandard.app",
  "standard-postmortem": "https://postmortem.marketstandard.app",
};

const APP_DESCRIPTIONS: Record<MarketingProduct, string> = {
  "standard-polls": "Create interactive polls in Slack with a slash command. Every vote spreads your brand.",
  "standard-proof": "Capture verifiable social proof testimonials with one-click approval and embed widgets.",
  "standard-metrics": "Stripe-native SaaS analytics with payment links, quota monitoring, and churn cohorts.",
  "standard-hook": "Capture, inspect, and replay webhooks with per-event signing secrets and deliverability metrics.",
  "standard-release": "Semver release notes with auto-generated changelogs and AI-assisted summaries.",
  "standard-links": "Branded short links for Stripe payment links with click analytics.",
  "standard-vault": "Secret vault with environment-scoped tokens, AI reference mode, and audit log.",
  "standard-lens": "Postgres query optimizer with index recommendations and EXPLAIN analysis.",
  "standard-cron": "Cron job monitor with heartbeat tracking, failure alerts, and run history.",
  "standard-workspace": "Dev workspace control plane with status grid, tunnels, and depsync.",
  "standard-snippets": "Save, tag, version, and share code snippets with FloodG8 Plan Editor integration.",
  "standard-status": "Status page with incident intake webhooks and subscriber notifications.",
  "standard-regex": "Regex pattern library with test cases, public sharing, and forking.",
  "standard-postmortem": "Blameless incident retros with action items and recurrence detection.",
};

const APP_CATEGORIES: Record<MarketingProduct, string> = {
  "standard-polls": "BusinessApplication",
  "standard-proof": "BusinessApplication",
  "standard-metrics": "BusinessApplication",
  "standard-hook": "DeveloperApplication",
  "standard-release": "DeveloperApplication",
  "standard-links": "BusinessApplication",
  "standard-vault": "DeveloperApplication",
  "standard-lens": "DeveloperApplication",
  "standard-cron": "DeveloperApplication",
  "standard-workspace": "DeveloperApplication",
  "standard-snippets": "DeveloperApplication",
  "standard-status": "DeveloperApplication",
  "standard-regex": "DeveloperApplication",
  "standard-postmortem": "DeveloperApplication",
};

const GENERIC_FAQ: MarketingFaqItem[] = [
  {
    q: "Is there a free tier?",
    a: "Yes. Every Market Standard app ships with a usable free tier so you can validate the workflow before paying. Upgrade when you outgrow limits or want to remove the powered-by badge.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Each app is a standalone web service. Sign in with email magic link, connect your integrations, and start using the dashboard immediately.",
  },
  {
    q: "How does the powered-by badge work?",
    a: "Free-tier artifacts (poll messages, embed widgets, short-link redirects) carry a small 'Powered by Market Standard' badge. Upgrading removes the badge and unlocks higher limits.",
  },
  {
    q: "Can I use this with the rest of the Market Standard suite?",
    a: "Yes. Every app cross-links to its siblings — Standard Polls surfaces Standard Standup, Standard Metrics deep-links to Standard Links, and so on. Sign in once with the same email.",
  },
  {
    q: "Where is my data stored?",
    a: "Postgres on Supabase, encrypted at rest. Each app exposes a privacy page detailing what is stored and for how long. You can export or delete your data at any time.",
  },
];

const GENERIC_COMPARISON: ComparisonBlock = {
  title: "How Market Standard compares",
  columns: [
    { name: "Spreadsheets", highlight: false },
    { name: "Generic SaaS", highlight: false },
    { name: "Market Standard", highlight: true },
  ],
  rows: [
    { feature: "Purpose-built for the workflow", values: ["No", "Partial", "Yes"] },
    { feature: "Free tier with no credit card", values: ["—", "Sometimes", "Yes"] },
    { feature: "Open schema (Postgres + Drizzle)", values: ["No", "No", "Yes"] },
    { feature: "Viral powered-by badge on free tier", values: ["No", "No", "Yes"] },
    { feature: "Cross-sells into the rest of the suite", values: ["No", "No", "Yes"] },
    { feature: "Self-hostable source-available code", values: ["No", "No", "Yes"] },
  ],
};

export function buildMarketingRichContent(
  product: MarketingProduct,
  productLabel: string,
): RichContent {
  const url = APP_URLS[product];
  const description = APP_DESCRIPTIONS[product];
  const category = APP_CATEGORIES[product];
  const softwareApp: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: productLabel,
    applicationCategory: category,
    operatingSystem: "Web",
    url,
    description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: "Market Standard",
      url: "https://marketstandard.app",
    },
  };

  const faqPage: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: GENERIC_FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  const breadcrumb: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Market Standard",
        item: "https://marketstandard.app",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: productLabel,
        item: url,
      },
    ],
  };

  return {
    faq: GENERIC_FAQ,
    comparison: GENERIC_COMPARISON,
    jsonLd: [softwareApp, faqPage, breadcrumb],
  };
}

export interface MarketingMetadataInput {
  product: MarketingProduct;
  productLabel: string;
  title: string;
  description: string;
  /** Path to an OG image relative to the app root, e.g. "/opengraph-image". Defaults to "/opengraph-image". */
  ogImage?: string;
}

/**
 * Builds OpenGraph + Twitter Card metadata fields that can be spread into a
 * Next.js `Metadata` export. Returns a plain object so the UI package does not
 * need to depend on `next`.
 */
export function buildMarketingMetadata({
  product,
  productLabel,
  title,
  description,
  ogImage = "/opengraph-image",
}: MarketingMetadataInput): {
  openGraph: Record<string, unknown>;
  twitter: Record<string, unknown>;
  metadataBase?: URL;
  alternates?: { canonical: string };
  applicationName: string;
  authors: { name: string; url: string }[];
  creator: string;
  keywords: string[];
} {
  const url = APP_URLS[product];
  return {
    applicationName: productLabel,
    openGraph: {
      title,
      description,
      url,
      siteName: productLabel,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: productLabel,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: url },
    authors: [{ name: "Market Standard", url: "https://marketstandard.app" }],
    creator: "Market Standard",
    keywords: [
      productLabel,
      "Market Standard",
      "SaaS",
      APP_DESCRIPTIONS[product].split(".")[0] ?? productLabel,
    ],
  };
}
