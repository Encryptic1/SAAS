/**
 * Deploy all 14 apps to Vercel production from the repo root.
 * Each app is deployed with `vercel --prod --yes --project <name> --scope marketstandard`.
 * Results are written to deploy-logs/final-deploy-results.json.
 */
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
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

const results = [];
const logDir = path.join(ROOT, "deploy-logs");
fs.mkdirSync(logDir, { recursive: true });

for (const app of APPS) {
  const t0 = Date.now();
  console.log(`\n=== Deploying ${app} ===`);
  try {
    const out = execSync(
      `vercel --prod --yes --project ${app} --scope marketstandard`,
      {
        cwd: ROOT,
        timeout: 300000,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    // Extract the production URL from the output
    const urlMatch = out.match(/Production\s+(https:\/\/[^\s]+)/);
    const aliasMatch = out.match(/Aliased\s+(https:\/\/[^\s]+)/);
    const url = aliasMatch?.[1] || urlMatch?.[1] || "unknown";
    console.log(`  OK  ${app} -> ${url} (${elapsed}s)`);
    results.push({ app, status: "ok", url, elapsed });
  } catch (err) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const errMsg = (err.stdout || err.stderr || err.message || "").slice(-500);
    console.error(`  FAIL ${app} (${elapsed}s): ${errMsg.slice(0, 200)}`);
    results.push({ app, status: "fail", error: errMsg, elapsed });
  }
}

const summaryPath = path.join(logDir, "final-deploy-results.json");
fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));

const ok = results.filter((r) => r.status === "ok").length;
const fail = results.filter((r) => r.status === "fail").length;
console.log(`\n=== Summary: ${ok} ok, ${fail} failed ===`);
console.log(`Results written to ${summaryPath}`);

if (fail > 0) {
  console.log("\nFailed apps:");
  results.filter((r) => r.status === "fail").forEach((r) => {
    console.log(`  - ${r.app}`);
  });
  process.exit(1);
}
