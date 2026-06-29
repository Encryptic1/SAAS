/**
 * Add `packageManager: pnpm@9.15.0` to each app's package.json so Vercel
 * uses pnpm (not npm) for the install step during monorepo builds.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
import path from "node:path";

const APPS_DIR = resolve(ROOT, "apps");
const PM = "pnpm@9.15.0";

function main() {
  const apps = readdirSync(APPS_DIR).filter((d) => d.startsWith("standard-")).sort();
  let changed = 0;
  for (const app of apps) {
    const file = resolve(APPS_DIR, app, "package.json");
    const pkg = JSON.parse(readFileSync(file, "utf8"));
    if (pkg.packageManager === PM) {
      console.log(`skip  ${app} (already set)`);
      continue;
    }
    pkg.packageManager = PM;
    writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log(`fixed ${app}`);
    changed++;
  }
  console.log(`\nDone. ${changed} package.json file(s) updated.`);
}

main();
