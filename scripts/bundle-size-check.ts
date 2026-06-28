/**
 * Phase 10: bundle size guard. Sums the size of each app's .next/static
 * directory and fails if any app exceeds the per-app budget (default 3 MB).
 * Run after `pnpm build`. Exits non-zero on budget breach so CI can fail.
 *
 * Usage: pnpm exec tsx scripts/bundle-size-check.ts [--budget-bytes=3145728]
 */
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const DEFAULT_BUDGET = 3 * 1024 * 1024; // 3 MB per app

function parseBudget(): number {
  const arg = process.argv.find((a) => a.startsWith("--budget-bytes="));
  if (arg) return Number(arg.split("=")[1]);
  const mbArg = process.argv.find((a) => a.startsWith("--budget-mb="));
  if (mbArg) return Number(mbArg.split("=")[1]) * 1024 * 1024;
  return DEFAULT_BUDGET;
}

async function dirSize(dir: string): Promise<number> {
  let total = 0;
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const s = await stat(full);
    if (s.isDirectory()) total += await dirSize(full);
    else total += s.size;
  }
  return total;
}

async function main() {
  const budget = parseBudget();
  const apps = await readdir("apps");
  let breaches = 0;
  console.log(`Bundle size check (budget: ${(budget / 1024 / 1024).toFixed(1)} MB per app)`);
  for (const app of apps) {
    const staticDir = join("apps", app, ".next", "static");
    const size = await dirSize(staticDir);
    if (size === 0) {
      console.log(`  ${app.padEnd(22)} (no .next/static — skipped)`);
      continue;
    }
    const mb = size / 1024 / 1024;
    const flag = size > budget ? "OVER BUDGET" : "ok";
    console.log(`  ${app.padEnd(22)} ${mb.toFixed(2).padStart(7)} MB  ${flag}`);
    if (size > budget) breaches++;
  }
  if (breaches > 0) {
    console.error(`\nBundle size check failed: ${breaches} app(s) over budget.`);
    process.exit(1);
  }
  console.log("\nBundle size check passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
