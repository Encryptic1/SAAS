import type { MarketingProduct } from "./marketing-landing";

/**
 * Resolve portfolio URLs for cross-app nav + suite switcher.
 *
 * Priority per app:
 *   1. `NEXT_PUBLIC_<APP>_URL` env var (explicit override — wins always)
 *   2. `http://localhost:<port>` when `NEXT_PUBLIC_LOCAL_DEV=true` (local dev stack)
 *   3. `https://<app>.marketstandard.app` (production default)
 *
 * External siblings (FloodG8, SyncDevTime) use their own env vars with a
 * production fallback.
 */
const LOCAL_DEV_APPS: Record<string, { port: number }> = {
  polls: { port: 3001 },
  proof: { port: 3002 },
  metrics: { port: 3003 },
  hook: { port: 3004 },
  release: { port: 3005 },
  vault: { port: 3006 },
  links: { port: 3007 },
  snippets: { port: 3008 },
  status: { port: 3009 },
  regex: { port: 3010 },
  postmortem: { port: 3011 },
  lens: { port: 3012 },
  cron: { port: 3013 },
  workspace: { port: 3014 },
};

function resolveAppUrl(app: string, envOverride: string | undefined): string {
  if (envOverride) return envOverride;
  if (process.env.NEXT_PUBLIC_LOCAL_DEV === "true") {
    const meta = LOCAL_DEV_APPS[app];
    if (meta) return `http://localhost:${meta.port}`;
  }
  return `https://${app}.marketstandard.app`;
}

/**
 * Resolve a single portfolio app's base URL by its short key
 * (e.g. "hook", "metrics", "postmortem"). Use this in app-level code
 * instead of `process.env.NEXT_PUBLIC_X_URL ?? "http://localhost:30XX"`
 * so production links resolve to `https://<app>.marketstandard.app`.
 */
export function resolvePortfolioUrl(app: string): string {
  const envVarName = `NEXT_PUBLIC_${app.toUpperCase()}_URL`;
  return resolveAppUrl(app, process.env[envVarName]);
}

export function getPortfolioUrls() {
  return {
    polls: resolveAppUrl("polls", process.env.NEXT_PUBLIC_POLLS_URL),
    proof: resolveAppUrl("proof", process.env.NEXT_PUBLIC_PROOF_URL),
    metrics: resolveAppUrl("metrics", process.env.NEXT_PUBLIC_METRICS_URL),
    hook: resolveAppUrl("hook", process.env.NEXT_PUBLIC_HOOK_URL),
    release: resolveAppUrl("release", process.env.NEXT_PUBLIC_RELEASE_URL),
    vault: resolveAppUrl("vault", process.env.NEXT_PUBLIC_VAULT_URL),
    links: resolveAppUrl("links", process.env.NEXT_PUBLIC_LINKS_URL),
    snippets: resolveAppUrl("snippets", process.env.NEXT_PUBLIC_SNIPPETS_URL),
    status: resolveAppUrl("status", process.env.NEXT_PUBLIC_STATUS_URL),
    regex: resolveAppUrl("regex", process.env.NEXT_PUBLIC_REGEX_URL),
    postmortem: resolveAppUrl("postmortem", process.env.NEXT_PUBLIC_POSTMORTEM_URL),
    lens: resolveAppUrl("lens", process.env.NEXT_PUBLIC_LENS_URL),
    cron: resolveAppUrl("cron", process.env.NEXT_PUBLIC_CRON_URL),
    workspace: resolveAppUrl("workspace", process.env.NEXT_PUBLIC_WORKSPACE_URL),
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
  "standard-workspace": ["polls", "proof", "metrics", "hook", "release", "vault", "links", "snippets", "status", "regex", "postmortem", "lens", "cron", "floodg8", "syncdevtime"],
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
  workspace: "Workspace",
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
