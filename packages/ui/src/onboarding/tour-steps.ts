import type { DashboardProduct } from "../dashboard/shell";

export type TourStep = {
  title: string;
  detail: string;
  href?: string;
};

type StepSeed = [title: string, detail: string, href?: string];

const STEP_SEEDS: Partial<Record<DashboardProduct, StepSeed[]>> = {
  "standard-polls": [
    ["Create your first poll", "Spin up a poll and share the link to start collecting votes.", "/dashboard"],
    ["Install the Slack bot", "Run /polls in any channel to launch polls without leaving Slack.", "/dashboard/settings"],
    ["Review analytics", "See participation, vote distribution, and trends over time.", "/dashboard/analytics"],
  ],
  "standard-proof": [
    ["Create a collection", "Group testimonials by product or campaign to keep them organized.", "/dashboard"],
    ["Add a testimonial", "Paste a quote, attribute it, and pin the best ones to the top.", "/dashboard"],
    ["Publish your wall", "Share your public collection page with prospects.", "/dashboard"],
  ],
  "standard-metrics": [
    ["Connect Stripe", "Sync your Stripe data to unlock revenue dashboards.", "/dashboard/settings"],
    ["Add a payment link", "Create shareable payment links and track conversions.", "/dashboard/links"],
    ["Open analytics", "MRR, churn, and LTV are calculated automatically.", "/dashboard/analytics"],
  ],
  "standard-hook": [
    ["Create an inbox", "Each inbox gets a unique capture URL for incoming webhooks.", "/dashboard/inboxes"],
    ["Send a test event", "POST to your inbox slug to see events appear in real time.", "/dashboard/inboxes"],
    ["Replay events", "Inspect and replay any captured event downstream.", "/dashboard"],
  ],
  "standard-release": [
    ["Add a repo", "Connect a GitHub repo to auto-draft release notes.", "/dashboard"],
    ["Generate release notes", "Compile commits, PRs, and contributors into a polished note.", "/dashboard"],
    ["Publish", "Share notes to your changelog or export them.", "/dashboard"],
  ],
  "standard-links": [
    ["Create a short link", "Paste a destination URL and grab a trackable short link.", "/dashboard/links"],
    ["View analytics", "Clicks, referrers, and geo breakdowns for every link.", "/dashboard/analytics"],
    ["Manage billing", "Upgrade or downgrade your plan anytime.", "/dashboard/billing"],
  ],
  "standard-vault": [
    ["Create a project", "Group secrets by project so they stay scoped.", "/dashboard"],
    ["Add secrets", "Store API keys and credentials with envelope encryption.", "/dashboard"],
    ["Generate a token", "Mint a read-only token for CI or your runtime.", "/dashboard"],
  ],
  "standard-snippets": [
    ["Create a snippet", "Save reusable code blocks with syntax highlighting.", "/dashboard"],
    ["Version it", "Every save creates a version you can roll back to.", "/dashboard"],
    ["Share a link", "Generate a shareable, expiring link for any snippet.", "/dashboard"],
  ],
  "standard-status": [
    ["Create a pipeline", "Track a deployment pipeline and its stages.", "/dashboard"],
    ["Log a deployment", "Record deploys and link them to incidents.", "/dashboard"],
    ["Open an incident", "Surface active incidents and updates to your status page.", "/dashboard"],
  ],
  "standard-regex": [
    ["Create a pattern", "Save a tested regex with a description and tags.", "/dashboard"],
    ["Fork a public pattern", "Browse community patterns and fork your own variant.", "/dashboard"],
    ["Publish", "Share a pattern publicly for the community.", "/dashboard"],
  ],
  "standard-postmortem": [
    ["Open an incident", "Start a postmortem with timeline, impact, and root cause.", "/dashboard/new"],
    ["Add action items", "Track owners and due dates for every follow-up.", "/dashboard"],
    ["Detect recurrence", "Link related incidents and let embeddings flag repeats.", "/dashboard/recurrence"],
  ],
  "standard-lens": [
    ["Save a query", "Pin your most-used queries to the library.", "/dashboard"],
    ["Capture a slow query", "Paste an EXPLAIN plan to get targeted findings.", "/dashboard/explain"],
    ["Review slow queries", "See the slowest queries ranked by duration.", "/dashboard/slow"],
  ],
  "standard-cron": [
    ["Add a job", "Register a cron job and grab its heartbeat token.", "/dashboard"],
    ["Ping the heartbeat", "POST to /api/heartbeat/:token after each run.", "/dashboard"],
    ["Inspect runs", "See duration, status, and drift for every run.", "/dashboard"],
  ],
};

const FALLBACK: StepSeed[] = [
  ["Explore the dashboard", "Your main workspace lives here.", "/dashboard"],
  ["Check analytics", "See how your data trends over time.", "/dashboard/analytics"],
  ["Manage billing", "Review your plan and usage.", "/dashboard/billing"],
];

export function defaultTourSteps(product: DashboardProduct): TourStep[] {
  const seeds = STEP_SEEDS[product] ?? FALLBACK;
  return seeds.map(([title, detail, href]) => ({ title, detail, href }));
}
