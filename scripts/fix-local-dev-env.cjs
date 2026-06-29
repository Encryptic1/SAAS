/**
 * Inspect + fix NEXT_PUBLIC_LOCAL_DEV on all 14 Vercel projects.
 *
 * 1. List current env vars for each project (production env).
 * 2. If NEXT_PUBLIC_LOCAL_DEV=true is set in production, remove it.
 *    (Keep it in preview/development if present.)
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

const APPS = [
  "standard-polls",
  "standard-proof",
  "standard-metrics",
  "standard-hook",
  "standard-release",
  "standard-vault",
  "standard-links",
  "standard-snippets",
  "standard-status",
  "standard-regex",
  "standard-postmortem",
  "standard-lens",
  "standard-cron",
  "standard-workspace",
];

async function apiGet(token, urlPath) {
  const res = await fetch(`https://api.vercel.com${urlPath}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, json, text };
}

async function apiDelete(token, urlPath) {
  const res = await fetch(`https://api.vercel.com${urlPath}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, text: await res.text() };
}

async function main() {
  const globalDir = cliConfig.getGlobalPathConfig();
  let token;
  try {
    const creds = cliAuth.readCredentials(globalDir);
    token = creds.token;
  } catch (err) {
    console.error("Could not read Vercel CLI token:", err.message);
    process.exit(1);
  }
  if (!token) {
    console.error("No Vercel token. Run `vercel login`.");
    process.exit(1);
  }

  let removed = 0;
  let kept = 0;
  let missing = 0;

  for (const app of APPS) {
    // List env vars for this project (all envs)
    const list = await apiGet(token, `/v9/projects/${encodeURIComponent(app)}/env?teamId=${TEAM}`);
    if (list.status !== 200 || !list.json?.envs) {
      console.log(`  FAIL ${app.padEnd(22)} list status=${list.status}`);
      continue;
    }
    const envs = list.json.envs;
    // Find NEXT_PUBLIC_LOCAL_DEV in production
    const prodMatches = envs.filter(
      (e) => e.key === "NEXT_PUBLIC_LOCAL_DEV" && e.target.includes("production"),
    );
    if (prodMatches.length === 0) {
      console.log(`  OK   ${app.padEnd(22)} no NEXT_PUBLIC_LOCAL_DEV in production`);
      missing++;
      continue;
    }
    // Remove each production-targeted entry
    for (const env of prodMatches) {
      const del = await apiDelete(
        token,
        `/v9/projects/${encodeURIComponent(app)}/env/${env.id}?teamId=${TEAM}`,
      );
      if (del.status === 200) {
        console.log(`  DEL  ${app.padEnd(22)} ${env.key} (id=${env.id.slice(0, 8)}) value="${env.value}"`);
        removed++;
      } else {
        console.log(`  FAIL ${app.padEnd(22)} delete status=${del.status} ${del.text.slice(0, 100)}`);
      }
    }
  }

  console.log(`\n=== Removed ${removed} production NEXT_PUBLIC_LOCAL_DEV entries, ${missing} apps clean, ${kept} kept ===`);
  if (removed > 0) {
    console.log("\nNOTE: You must REDEPLOY each affected project for the env change to take effect.");
    console.log("      The fastest path is `vercel --prod --cwd apps/<app>` per app, or trigger a redeploy via the API.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
