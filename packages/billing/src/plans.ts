export type ProductId =
  | "standard-polls"
  | "standard-proof"
  | "standard-metrics"
  | "standard-hook"
  | "standard-release"
  | "standard-links"
  | "standard-vault"
  | "standard-lens"
  | "standard-cron"
  | "standard-snippets"
  | "standard-status"
  | "standard-regex"
  | "standard-postmortem"
  | "standard-workspace";

export type PlanTier = "free" | "starter" | "growth" | "business";

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  stripePriceId?: string;
  stripeLookupKey?: string;
  limits: Record<string, number | boolean>;
  showBadge: boolean;
}

function envPrice(key: string): string | undefined {
  return process.env[key] || undefined;
}

const pollsStarter = envPrice("STRIPE_PRICE_POLLS_STARTER");
const pollsGrowth = envPrice("STRIPE_PRICE_POLLS_GROWTH");
const proofStarter = envPrice("STRIPE_PRICE_PROOF_STARTER");
const proofGrowth = envPrice("STRIPE_PRICE_PROOF_GROWTH");
const metricsStarter = envPrice("STRIPE_PRICE_METRICS_STARTER");
const metricsGrowth = envPrice("STRIPE_PRICE_METRICS_GROWTH");
const hookStarter = envPrice("STRIPE_PRICE_HOOK_STARTER");
const releaseStarter = envPrice("STRIPE_PRICE_RELEASE_STARTER");
const linksStarter = envPrice("STRIPE_PRICE_LINKS_STARTER");
const vaultStarter = envPrice("STRIPE_PRICE_VAULT_STARTER");
const lensStarter = envPrice("STRIPE_PRICE_LENS_STARTER");
const lensGrowth = envPrice("STRIPE_PRICE_LENS_GROWTH");
const cronStarter = envPrice("STRIPE_PRICE_CRON_STARTER");
const cronGrowth = envPrice("STRIPE_PRICE_CRON_GROWTH");
const snippetsStarter = envPrice("STRIPE_PRICE_SNIPPETS_STARTER");
const statusStarter = envPrice("STRIPE_PRICE_STATUS_STARTER");
const regexStarter = envPrice("STRIPE_PRICE_REGEX_STARTER");
const postmortemStarter = envPrice("STRIPE_PRICE_POSTMORTEM_STARTER");
const workspaceStarter = envPrice("STRIPE_PRICE_WORKSPACE_STARTER");
const workspaceGrowth = envPrice("STRIPE_PRICE_WORKSPACE_GROWTH");

export const PLANS: Record<ProductId, PlanDefinition[]> = {
  "standard-polls": [
    {
      tier: "free",
      name: "Free",
      priceMonthly: 0,
      limits: { pollsPerMonth: 10, showBadge: true },
      showBadge: true,
    },
    {
      tier: "starter",
      name: "Starter",
      priceMonthly: 19,
      stripePriceId: pollsStarter,
      stripeLookupKey: "standard-polls-starter-monthly",
      limits: { pollsPerMonth: 100, showBadge: false },
      showBadge: false,
    },
    {
      tier: "growth",
      name: "Growth",
      priceMonthly: 49,
      stripePriceId: pollsGrowth,
      stripeLookupKey: "standard-polls-growth-monthly",
      limits: { pollsPerMonth: -1, showBadge: false },
      showBadge: false,
    },
  ],
  "standard-proof": [
    {
      tier: "free",
      name: "Free",
      priceMonthly: 0,
      limits: { testimonials: 10, collections: 1, showBadge: true },
      showBadge: true,
    },
    {
      tier: "starter",
      name: "Starter",
      priceMonthly: 19,
      stripePriceId: proofStarter,
      stripeLookupKey: "standard-proof-starter-monthly",
      limits: { testimonials: 50, collections: 3, showBadge: false },
      showBadge: false,
    },
    {
      tier: "growth",
      name: "Growth",
      priceMonthly: 49,
      stripePriceId: proofGrowth,
      stripeLookupKey: "standard-proof-growth-monthly",
      limits: { testimonials: -1, collections: -1, showBadge: false },
      showBadge: false,
    },
  ],
  "standard-metrics": [
    {
      tier: "free",
      name: "Free",
      priceMonthly: 0,
      limits: { historyDays: 30, showBadge: true },
      showBadge: true,
    },
    {
      tier: "starter",
      name: "Starter",
      priceMonthly: 29,
      stripePriceId: metricsStarter,
      stripeLookupKey: "standard-metrics-starter-monthly",
      limits: { historyDays: 365, showBadge: false },
      showBadge: false,
    },
    {
      tier: "growth",
      name: "Growth",
      priceMonthly: 79,
      stripePriceId: metricsGrowth,
      stripeLookupKey: "standard-metrics-growth-monthly",
      limits: { historyDays: -1, showBadge: false },
      showBadge: false,
    },
  ],
  "standard-hook": [
    {
      tier: "free",
      name: "Free",
      priceMonthly: 0,
      limits: { inboxes: 1, eventsPerMonth: 100 },
      showBadge: true,
    },
    {
      tier: "starter",
      name: "Starter",
      priceMonthly: 9,
      stripePriceId: hookStarter,
      stripeLookupKey: "standard-hook-starter-monthly",
      limits: { inboxes: 5, eventsPerMonth: 10000 },
      showBadge: false,
    },
  ],
  "standard-release": [
    {
      tier: "free",
      name: "Free",
      priceMonthly: 0,
      limits: { repos: 1, releasesPerMonth: 5 },
      showBadge: true,
    },
    {
      tier: "starter",
      name: "Starter",
      priceMonthly: 15,
      stripePriceId: releaseStarter,
      stripeLookupKey: "standard-release-starter-monthly",
      limits: { repos: -1, releasesPerMonth: -1 },
      showBadge: false,
    },
  ],
  "standard-links": [
    {
      tier: "free",
      name: "Free",
      priceMonthly: 0,
      limits: { links: 3 },
      showBadge: true,
    },
    {
      tier: "starter",
      name: "Starter",
      priceMonthly: 19,
      stripePriceId: linksStarter,
      stripeLookupKey: "standard-links-starter-monthly",
      limits: { links: -1 },
      showBadge: false,
    },
  ],
  "standard-vault": [
    {
      tier: "free",
      name: "Free",
      priceMonthly: 0,
      limits: { projects: 1, secretsPerProject: 25 },
      showBadge: true,
    },
    {
      tier: "starter",
      name: "Starter",
      priceMonthly: 19,
      stripePriceId: vaultStarter,
      stripeLookupKey: "standard-vault-starter-monthly",
      limits: { projects: -1, secretsPerProject: -1 },
      showBadge: false,
    },
  ],
  "standard-lens": [
    {
      tier: "free",
      name: "Free",
      priceMonthly: 0,
      limits: { queriesPerDay: 100, slowQueryRetentionDays: 7 },
      showBadge: true,
    },
    {
      tier: "starter",
      name: "Starter",
      priceMonthly: 29,
      stripePriceId: lensStarter,
      stripeLookupKey: "standard-lens-starter-monthly",
      limits: { queriesPerDay: -1, slowQueryRetentionDays: 30 },
      showBadge: false,
    },
    {
      tier: "growth",
      name: "Growth",
      priceMonthly: 99,
      stripePriceId: lensGrowth,
      stripeLookupKey: "standard-lens-growth-monthly",
      limits: { queriesPerDay: -1, slowQueryRetentionDays: -1 },
      showBadge: false,
    },
  ],
  "standard-cron": [
    {
      tier: "free",
      name: "Free",
      priceMonthly: 0,
      limits: { monitors: 3, runHistoryDays: 7 },
      showBadge: true,
    },
    {
      tier: "starter",
      name: "Starter",
      priceMonthly: 19,
      stripePriceId: cronStarter,
      stripeLookupKey: "standard-cron-starter-monthly",
      limits: { monitors: 25, runHistoryDays: 30 },
      showBadge: false,
    },
    {
      tier: "growth",
      name: "Growth",
      priceMonthly: 49,
      stripePriceId: cronGrowth,
      stripeLookupKey: "standard-cron-growth-monthly",
      limits: { monitors: -1, runHistoryDays: -1 },
      showBadge: false,
    },
  ],
  "standard-snippets": [
    {
      tier: "free",
      name: "Free",
      priceMonthly: 0,
      limits: { snippets: 25 },
      showBadge: true,
    },
    {
      tier: "starter",
      name: "Starter",
      priceMonthly: 9,
      stripePriceId: snippetsStarter,
      stripeLookupKey: "standard-snippets-starter-monthly",
      limits: { snippets: 500 },
      showBadge: false,
    },
  ],
  "standard-status": [
    {
      tier: "free",
      name: "Free",
      priceMonthly: 0,
      limits: { pipelines: 3 },
      showBadge: true,
    },
    {
      tier: "starter",
      name: "Starter",
      priceMonthly: 19,
      stripePriceId: statusStarter,
      stripeLookupKey: "standard-status-starter-monthly",
      limits: { pipelines: 25 },
      showBadge: false,
    },
  ],
  "standard-regex": [
    {
      tier: "free",
      name: "Free",
      priceMonthly: 0,
      limits: { patterns: 10 },
      showBadge: true,
    },
    {
      tier: "starter",
      name: "Starter",
      priceMonthly: 9,
      stripePriceId: regexStarter,
      stripeLookupKey: "standard-regex-starter-monthly",
      limits: { patterns: Infinity },
      showBadge: false,
    },
  ],
  "standard-postmortem": [
    {
      tier: "free",
      name: "Free",
      priceMonthly: 0,
      limits: { incidents: 5 },
      showBadge: true,
    },
    {
      tier: "starter",
      name: "Starter",
      priceMonthly: 19,
      stripePriceId: postmortemStarter,
      stripeLookupKey: "standard-postmortem-starter-monthly",
      limits: { incidents: Infinity },
      showBadge: false,
    },
  ],
  "standard-workspace": [
    {
      tier: "free",
      name: "Free",
      priceMonthly: 0,
      limits: { users: 1, sessions: 1 },
      showBadge: true,
    },
    {
      tier: "starter",
      name: "Starter",
      priceMonthly: 9,
      stripePriceId: workspaceStarter,
      stripeLookupKey: "standard-workspace-starter-monthly",
      limits: { users: 1, sessions: 5, tunnels: -1 },
      showBadge: false,
    },
    {
      tier: "growth",
      name: "Growth",
      priceMonthly: 29,
      stripePriceId: workspaceGrowth,
      stripeLookupKey: "standard-workspace-growth-monthly",
      limits: { users: -1, sessions: -1, tunnels: -1 },
      showBadge: false,
    },
  ],
};

export function getPlan(product: ProductId, tier: PlanTier): PlanDefinition {
  const plan = PLANS[product].find((p) => p.tier === tier);
  if (!plan) {
    throw new Error(`Unknown plan: ${product}/${tier}`);
  }
  return plan;
}

export function shouldShowBadge(product: ProductId, tier: PlanTier): boolean {
  return getPlan(product, tier).showBadge;
}

export function isWithinLimit(value: number, limit: number): boolean {
  if (limit === -1) return true;
  return value < limit;
}

export function getPaidPlans(product: ProductId): PlanDefinition[] {
  return PLANS[product].filter((p) => p.tier !== "free");
}
