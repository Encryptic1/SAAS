import type { MarketingProduct } from "./marketing-landing";

export function getPortfolioUrls() {
  return {
    polls: process.env.NEXT_PUBLIC_POLLS_URL ?? "http://localhost:3001",
    proof: process.env.NEXT_PUBLIC_PROOF_URL ?? "http://localhost:3002",
    metrics: process.env.NEXT_PUBLIC_METRICS_URL ?? "http://localhost:3003",
    hook: process.env.NEXT_PUBLIC_HOOK_URL ?? "http://localhost:3004",
    release: process.env.NEXT_PUBLIC_RELEASE_URL ?? "http://localhost:3005",
    vault: process.env.NEXT_PUBLIC_VAULT_URL ?? "http://localhost:3006",
    links: process.env.NEXT_PUBLIC_LINKS_URL ?? "http://localhost:3007",
    snippets: process.env.NEXT_PUBLIC_SNIPPETS_URL ?? "http://localhost:3008",
    status: process.env.NEXT_PUBLIC_STATUS_URL ?? "http://localhost:3009",
    regex: process.env.NEXT_PUBLIC_REGEX_URL ?? "http://localhost:3010",
    postmortem: process.env.NEXT_PUBLIC_POSTMORTEM_URL ?? "http://localhost:3011",
    lens: process.env.NEXT_PUBLIC_LENS_URL ?? "https://lens.marketstandard.app",
    cron: process.env.NEXT_PUBLIC_CRON_URL ?? "https://cron.marketstandard.app",
    floodg8: process.env.NEXT_PUBLIC_FLOODG8_URL ?? "https://floodg8.com",
    syncdevtime: process.env.NEXT_PUBLIC_SYNCDEVTIME_URL ?? "https://syncdevtime.com",
  };
}

const SIBLING_KEYS: Record<MarketingProduct, Array<keyof ReturnType<typeof getPortfolioUrls>>> = {
  "standard-polls": ["proof", "metrics", "hook", "release", "vault", "links"],
  "standard-proof": ["polls", "metrics", "hook", "release", "vault", "links"],
  "standard-metrics": ["polls", "proof", "hook", "release", "vault", "links"],
  "standard-hook": ["polls", "proof", "metrics", "release", "vault", "links", "cron"],
  "standard-release": ["polls", "proof", "metrics", "hook", "vault", "links"],
  "standard-links": ["polls", "proof", "metrics", "hook", "release", "vault"],
  "standard-vault": ["polls", "proof", "metrics", "hook", "release", "links"],
  "standard-lens": ["metrics", "vault", "cron"],
  "standard-cron": ["hook", "status", "vault", "lens"],
  "standard-snippets": ["metrics", "hook", "release", "vault"],
  "standard-status": ["hook", "release", "cron", "snippets", "vault"],
  "standard-regex": ["snippets", "hook", "vault"],
  "standard-postmortem": ["hook", "status", "snippets", "vault"],
};

const SIBLING_LABELS: Record<string, string> = {
  polls: "Polls",
  proof: "Proof",
  metrics: "Metrics",
  hook: "Hook",
  release: "Release",
  vault: "Vault",
  links: "Links",
  snippets: "Snippets",
  status: "Status",
  regex: "Regex",
  postmortem: "Postmortem",
  lens: "Lens",
  cron: "Cron",
  floodg8: "FloodG8",
  syncdevtime: "SyncDevTime",
};

export function getSiblingLinks(product: MarketingProduct) {
  const urls = getPortfolioUrls();
  return SIBLING_KEYS[product].map((key) => ({
    label: SIBLING_LABELS[key]!,
    href: urls[key],
  }));
}
