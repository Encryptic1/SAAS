/**
 * One-off: extract the Vercel CLI's stored auth token from the OS keyring
 * and use it to set rootDirectory on each of the 14 Vercel projects.
 *
 * Uses the Vercel CLI's own @vercel/cli-auth module to read credentials,
 * so we don't need a separate API token — we reuse the CLI's session.
 */
const path = require("node:path");
const crypto = require("node:crypto");

// The Vercel CLI is installed globally; its node_modules live next to it.
const VERCEL_NM = path.join(
  process.env.APPDATA || process.env.HOME,
  "npm",
  "node_modules",
  "vercel",
  "node_modules",
);

// Make the Vercel CLI's @vercel/* packages resolvable.
require("node:module").Module.globalPaths.push(VERCEL_NM);

const cliAuth = require(path.join(VERCEL_NM, "@vercel", "cli-auth", "credentials-store.js"));
const cliConfig = require(path.join(VERCEL_NM, "@vercel", "cli-config", "dist", "cli-config.js"));

const TEAM = "marketstandard";
const REPO_ROOT = "F:\\dev\\SAAS";

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

async function main() {
  // 1. Read the stored credentials from the keyring (same path the CLI uses).
  const globalDir = cliConfig.getGlobalPathConfig();
  console.log("Vercel global config dir:", globalDir);

  let token;
  try {
    const creds = cliAuth.readCredentials(globalDir);
    token = creds.token;
    console.log("Got token from keyring (length:", token.length, ")");
  } catch (err) {
    console.error("Failed to read credentials from keyring:", err.message);
    process.exit(1);
  }

  if (!token) {
    console.error("No token found in keyring credentials.");
    process.exit(1);
  }

  // 2. For each app, PATCH the project to set rootDirectory.
  let ok = 0;
  let fail = 0;

  for (const appName of APPS) {
    const rootDir = `apps/${appName}`;
    const url = `https://api.vercel.com/v9/projects/${encodeURIComponent(appName)}?teamId=${TEAM}`;

    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rootDirectory: rootDir }),
      });

      if (res.ok) {
        const body = await res.json();
        console.log(`  OK  ${appName} -> rootDirectory=${body.rootDirectory}`);
        ok++;
      } else {
        const body = await res.text();
        console.error(`  FAIL ${appName} -> ${res.status} ${body.slice(0, 200)}`);
        fail++;
      }
    } catch (err) {
      console.error(`  ERR  ${appName} -> ${err.message}`);
      fail++;
    }
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed.`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
