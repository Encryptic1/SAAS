/**
 * Verify production health of all 14 Standard apps after the SSO redeploy.
 * Hits /api/health for each app and reports status + latency.
 * Also checks /auth/callback redirects (expect 3xx for no code).
 */
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
  let ok = 0;
  let fail = 0;

  console.log("--- /api/health check (expect 200) ---");
  for (const app of APPS) {
    const url = `https://${app}.vercel.app/api/health`;
    const t0 = Date.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const latencyMs = Date.now() - t0;
      const body = await res.text();
      const status = res.status;
      if (status === 200) {
        ok++;
        console.log(`  OK   ${app.padEnd(22)} ${status}  ${latencyMs}ms`);
      } else {
        fail++;
        console.log(`  FAIL ${app.padEnd(22)} ${status}  ${latencyMs}ms  ${body.slice(0, 80)}`);
      }
    } catch (err) {
      const latencyMs = Date.now() - t0;
      fail++;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  FAIL ${app.padEnd(22)} ERR  ${latencyMs}ms  ${msg.slice(0, 80)}`);
    }
  }
  console.log(`\n=== /api/health: ${ok} ok, ${fail} failed ===`);

  console.log("\n--- /auth/callback route check (expect 3xx redirect) ---");
  let callbackOk = 0;
  let callbackFail = 0;
  for (const app of APPS) {
    const url = `https://${app}.vercel.app/auth/callback`;
    try {
      const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
      if (res.status >= 300 && res.status < 400) {
        callbackOk++;
        const loc = res.headers.get("location") || "";
        console.log(`  OK   ${app.padEnd(22)} ${res.status} -> ${loc.slice(0, 60)}`);
      } else {
        callbackFail++;
        console.log(`  FAIL ${app.padEnd(22)} ${res.status} (expected 3xx redirect)`);
      }
    } catch (err) {
      callbackFail++;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  FAIL ${app.padEnd(22)} ERR  ${msg.slice(0, 80)}`);
    }
  }
  console.log(`\n=== /auth/callback: ${callbackOk} ok, ${callbackFail} failed ===`);

  process.exit(fail === 0 && callbackFail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
