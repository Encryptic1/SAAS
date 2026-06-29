/**
 * Quick health check for all 14 *.marketstandard.app custom domains.
 */
const APPS = [
  "polls", "proof", "metrics", "hook", "release", "vault", "links",
  "snippets", "status", "regex", "postmortem", "lens", "cron", "workspace",
];

async function main() {
  let ok = 0;
  let fail = 0;
  for (const sub of APPS) {
    const url = `https://${sub}.marketstandard.app/api/health`;
    const t0 = Date.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const ms = Date.now() - t0;
      if (res.status === 200) {
        ok++;
        console.log(`  OK   ${sub.padEnd(14)} ${res.status}  ${ms}ms`);
      } else {
        fail++;
        console.log(`  FAIL ${sub.padEnd(14)} ${res.status}  ${ms}ms`);
      }
    } catch (err) {
      const ms = Date.now() - t0;
      fail++;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  FAIL ${sub.padEnd(14)} ERR  ${ms}ms  ${msg.slice(0, 80)}`);
    }
  }
  console.log(`\n=== ${ok}/14 healthy ===`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
