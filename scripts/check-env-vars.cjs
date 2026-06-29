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
const APPS = ["standard-vault", "standard-links"];

async function main() {
  const globalDir = cliConfig.getGlobalPathConfig();
  const token = cliAuth.readCredentials(globalDir).token;
  for (const app of APPS) {
    console.log(`\n=== ${app} env vars (URL + LOCAL_DEV only) ===`);
    const res = await fetch(`https://api.vercel.com/v9/projects/${app}/env?teamId=${TEAM}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await res.json();
    if (!j.envs) {
      console.log("  status", res.status, JSON.stringify(j).slice(0, 200));
      continue;
    }
    for (const e of j.envs) {
      if (!/NEXT_PUBLIC_.*_URL|NEXT_PUBLIC_LOCAL_DEV/.test(e.key)) continue;
      const targets = (e.target || []).join(",") || "(none)";
      const val = e.value === null || e.value === undefined ? "(null/encrypted)" : `"${e.value}"`;
      console.log(`  ${e.key.padEnd(32)} target=${targets.padEnd(18)} value=${val}`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
