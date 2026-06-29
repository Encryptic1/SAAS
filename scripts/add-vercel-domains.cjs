/**
 * Add 14 custom domains to their respective Vercel projects.
 * Reuses the Vercel CLI keyring token (same approach as set-vercel-root-dir.cjs).
 *
 * For each app: POST /v9/projects/{name}/domains { name: "{sub}.marketstandard.app" }
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

// Map app slug -> custom domain
function appToDomain(app) {
  // standard-polls -> polls.marketstandard.app
  const sub = app.replace(/^standard-/, "");
  return `${sub}.marketstandard.app`;
}

async function main() {
  const globalDir = cliConfig.getGlobalPathConfig();
  let token;
  try {
    const creds = cliAuth.readCredentials(globalDir);
    token = creds.token;
  } catch (err) {
    console.error("Could not read Vercel CLI token from keyring:", err.message);
    console.error("Run `vercel login` first.");
    process.exit(1);
  }
  if (!token) {
    console.error("No Vercel token found. Run `vercel login` first.");
    process.exit(1);
  }

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const app of APPS) {
    const domain = appToDomain(app);
    const url = `https://api.vercel.com/v9/projects/${encodeURIComponent(app)}/domains?teamId=${TEAM}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
      });
      const body = await res.text();
      let json;
      try {
        json = JSON.parse(body);
      } catch {
        json = null;
      }
      if (res.status === 200 || res.status === 201) {
        console.log(`  OK    ${app.padEnd(22)} -> ${domain}`);
        ok++;
      } else if (res.status === 409 && body.includes("already exists")) {
        console.log(`  SKIP  ${app.padEnd(22)} -> ${domain} (already exists)`);
        skip++;
      } else if (json?.error?.code === "forbidden" || body.includes("domain_already_in_use")) {
        // Domain might be attached to another project — try to remove + re-add
        console.log(`  WARN  ${app.padEnd(22)} -> ${domain} (in use, attempting transfer)`);
        // Try DELETE from any project first
        const delRes = await fetch(
          `https://api.vercel.com/v9/domains/${encodeURIComponent(domain)}?teamId=${TEAM}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
        );
        if (delRes.status === 200) {
          // Retry the add
          const retryRes = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: domain }),
          });
          if (retryRes.status === 200 || retryRes.status === 201) {
            console.log(`  OK    ${app.padEnd(22)} -> ${domain} (transferred)`);
            ok++;
          } else {
            const retryBody = await retryRes.text();
            console.log(
              `  FAIL  ${app.padEnd(22)} -> ${domain} retry=${retryRes.status} ${retryBody.slice(0, 120)}`,
            );
            fail++;
          }
        } else {
          const delBody = await delRes.text();
          console.log(
            `  FAIL  ${app.padEnd(22)} -> ${domain} delete=${delRes.status} ${delBody.slice(0, 120)}`,
          );
          fail++;
        }
      } else {
        console.log(
          `  FAIL  ${app.padEnd(22)} -> ${domain} status=${res.status} ${body.slice(0, 160)}`,
        );
        fail++;
      }
    } catch (err) {
      console.log(`  FAIL  ${app.padEnd(22)} -> ${domain} err=${err.message}`);
      fail++;
    }
  }

  console.log(`\n=== Summary: ${ok} added, ${skip} skipped, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
