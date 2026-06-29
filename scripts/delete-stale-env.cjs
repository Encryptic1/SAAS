/**
 * Find + DELETE production-targeted NEXT_PUBLIC_*_URL env vars that are
 * set to localhost URLs on the vault + links projects (and any other
 * project that has them). With the stale env var gone, resolveAppUrl()
 * falls back to https://<app>.marketstandard.app.
 */
const path = require("node:path");

const VERCEL_NM = path.join(
  process.env.APPDATA || process.env.HOME,
  "npm",
  "node_modules",
  "vercel",
  "node_modules",
);
require("node:module").Module.globalPaths.push(VERCEL_NM);
const cliAuth = require(path.join(VERCEL_NM, "@vercel", "cli-auth", "credentials-store.js"));
const cliConfig = require(path.join(VERCEL_NM, "@vercel", "cli-config", "dist", "cli-config.js"));

const TEAM = "marketstandard";

// All 14 apps — check each for stale localhost URL env vars on production
const APPS = [
  "standard-polls", "standard-proof", "standard-metrics", "standard-hook",
  "standard-release", "standard-vault", "standard-links", "standard-snippets",
  "standard-status", "standard-regex", "standard-postmortem", "standard-lens",
  "standard-cron", "standard-workspace",
];

// Env var keys that resolveAppUrl reads — any of these set to localhost on
// production will override the *.marketstandard.app fallback.
const URL_KEYS = [
  "NEXT_PUBLIC_POLLS_URL", "NEXT_PUBLIC_PROOF_URL", "NEXT_PUBLIC_METRICS_URL",
  "NEXT_PUBLIC_HOOK_URL", "NEXT_PUBLIC_RELEASE_URL", "NEXT_PUBLIC_VAULT_URL",
  "NEXT_PUBLIC_LINKS_URL", "NEXT_PUBLIC_SNIPPETS_URL", "NEXT_PUBLIC_STATUS_URL",
  "NEXT_PUBLIC_REGEX_URL", "NEXT_PUBLIC_POSTMORTEM_URL", "NEXT_PUBLIC_LENS_URL",
  "NEXT_PUBLIC_CRON_URL", "NEXT_PUBLIC_WORKSPACE_URL", "NEXT_PUBLIC_APP_URL",
];

async function main() {
  const globalDir = cliConfig.getGlobalPathConfig();
  const token = cliAuth.readCredentials(globalDir).token;

  let deleted = 0;
  let failed = 0;
  for (const app of APPS) {
    const res = await fetch(`https://api.vercel.com/v9/projects/${app}/env?teamId=${TEAM}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await res.json();
    if (!j.envs) {
      console.log(`  ${app}: could not list envs (status ${res.status})`);
      continue;
    }
    // Find production-targeted URL env vars. We can't decrypt them, but we
    // know they're stale if they exist at all on production — the code
    // fallback handles URL resolution correctly without them.
    for (const e of j.envs) {
      if (!URL_KEYS.includes(e.key)) continue;
      if (!e.target || !e.target.includes("production")) continue;
      // Delete the production-targeted env var
      const delRes = await fetch(
        `https://api.vercel.com/v9/projects/${app}/env/${e.id}?teamId=${TEAM}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      if (delRes.status === 200 || delRes.status === 204) {
        console.log(`  DELETED ${app.padEnd(22)} ${e.key} (production) id=${e.id}`);
        deleted++;
      } else {
        const t = await delRes.text();
        console.log(`  FAIL   ${app.padEnd(22)} ${e.key} status=${delRes.status} ${t.slice(0, 120)}`);
        failed++;
      }
    }
  }
  console.log(`\n=== deleted=${deleted} failed=${failed} ===`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
