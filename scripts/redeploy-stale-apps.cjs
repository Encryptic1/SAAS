/**
 * Trigger production redeployments of the 7 stale apps via the Vercel API.
 * These apps had NEXT_PUBLIC_LOCAL_DEV=true baked into their builds; their
 * deployed bundles are stale. We redeploy from the latest code on main
 * (origin/main is in sync with local).
 *
 * After triggering, poll each deployment until ready, then report.
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
const GIT_ORG = "Encryptic1";
const GIT_REPO = "SAAS";
const GIT_REF = "main";

const APPS = [
  "standard-snippets",
  "standard-status",
  "standard-regex",
  "standard-postmortem",
  "standard-lens",
  "standard-cron",
  "standard-workspace",
];

async function api(token, method, urlPath, body) {
  const headers = { Authorization: `Bearer ${token}` };
  if (body) {
    headers["Content-Type"] = "application/json";
  }
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

  // 1. Trigger a new production deployment for each app
  console.log("--- Triggering production redeployments (from main) ---");
  const triggered = [];
  for (const app of APPS) {
    const body = {
      name: app,
      target: "production",
      gitSource: {
        type: "github",
        org: GIT_ORG,
        repo: GIT_REPO,
        ref: GIT_REF,
      },
    };
    const res = await api(token, "POST", `/v13/deployments?teamId=${TEAM}`, body);
    if (res.status === 200 || res.status === 201) {
      const d = res.json;
      const id = d.id || d.uid;
      const url = d.url ? `https://${d.url}` : "(pending)";
      console.log(`  OK   ${app.padEnd(22)} -> ${url}  (id=${id})`);
      triggered.push({ app, id, url });
    } else {
      console.log(
        `  FAIL ${app.padEnd(22)} status=${res.status} ${res.text.slice(0, 180)}`,
      );
    }
  }

  if (triggered.length === 0) {
    console.error("No deployments triggered. Exiting.");
    process.exit(1);
  }

  // 2. Poll until each deployment is READY
  console.log(`\n--- Polling ${triggered.length} deployments until READY (timeout 12 min) ---`);
  const deadline = Date.now() + 12 * 60 * 1000;
  const results = [];
  while (Date.now() < deadline && triggered.some((t) => !t.done)) {
    for (const t of triggered) {
      if (t.done) continue;
      const res = await api(token, "GET", `/v13/deployments/${t.id}?teamId=${TEAM}`);
      if (res.status === 200 && res.json) {
        const state = res.json.readyState || res.json.status;
        if (state === "READY") {
          t.done = true;
          t.finalUrl = res.json.url ? `https://${res.json.url}` : t.url;
          results.push({ app: t.app, ok: true, url: t.finalUrl });
          console.log(`  READY ${t.app.padEnd(22)} -> ${t.finalUrl}`);
        } else if (state === "ERROR" || state === "CANCELED") {
          t.done = true;
          results.push({ app: t.app, ok: false, state });
          console.log(`  ${state} ${t.app.padEnd(22)}`);
        } else {
          // QUEUED / BUILDING / INITIALIZING
          process.stdout.write(`  ${state || "?"} `);
        }
      }
    }
    if (triggered.some((t) => !t.done)) {
      process.stdout.write(".");
      await new Promise((r) => setTimeout(r, 8000));
    }
  }
  console.log("");

  // Mark timed-out ones
  for (const t of triggered) {
    if (!t.done) {
      results.push({ app: t.app, ok: false, state: "TIMEOUT" });
      console.log(`  TIMEOUT ${t.app.padEnd(22)}`);
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  console.log(`\n=== ${okCount}/${APPS.length} deployments READY ===`);
  process.exit(okCount === APPS.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
