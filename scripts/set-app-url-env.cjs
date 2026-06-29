/**
 * Set NEXT_PUBLIC_APP_URL on the "production" environment of all 14 Vercel
 * projects so server-side OAuth callbacks, webhook URLs, and client-side
 * self-links resolve to the correct *.marketstandard.app URL.
 *
 * Idempotent: if the env var already exists with the same value, Vercel
 * returns the existing record. If it exists with a different value, we
 * update it (Vercel upserts by key + environment).
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

const APP_TO_SUBDOMAIN = {
  "standard-polls": "polls",
  "standard-proof": "proof",
  "standard-metrics": "metrics",
  "standard-hook": "hook",
  "standard-release": "release",
  "standard-vault": "vault",
  "standard-links": "links",
  "standard-snippets": "snippets",
  "standard-status": "status",
  "standard-regex": "regex",
  "standard-postmortem": "postmortem",
  "standard-lens": "lens",
  "standard-cron": "cron",
  "standard-workspace": "workspace",
};

async function api(token, method, urlPath, body) {
  const headers = { Authorization: `Bearer ${token}` };
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`https://api.vercel.com${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, json, text };
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

  console.log("--- Setting NEXT_PUBLIC_APP_URL on production env for 14 projects ---");
  let okCount = 0;
  for (const [app, sub] of Object.entries(APP_TO_SUBDOMAIN)) {
    const value = `https://${sub}.marketstandard.app`;
    const body = {
      key: "NEXT_PUBLIC_APP_URL",
      value,
      type: "encrypted",
      target: ["production"],
    };
    const res = await api(token, "POST", `/v9/projects/${app}/env?teamId=${TEAM}`, body);
    if (res.status === 200 || res.status === 201) {
      console.log(`  OK   ${app.padEnd(22)} -> ${value}`);
      okCount++;
    } else {
      console.log(`  FAIL ${app.padEnd(22)} status=${res.status} ${res.text.slice(0, 200)}`);
    }
  }
  console.log(`\n=== ${okCount}/${Object.keys(APP_TO_SUBDOMAIN).length} projects updated ===`);
  process.exit(okCount === Object.keys(APP_TO_SUBDOMAIN).length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
