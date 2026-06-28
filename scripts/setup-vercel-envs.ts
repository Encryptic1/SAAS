#!/usr/bin/env tsx
/**
 * setup-vercel-envs.ts
 *
 * Pushes environment variables from each app's `.env.example` to its linked
 * Vercel project via the Vercel CLI (`vercel env add`).
 *
 * Prerequisites:
 *   1. `vercel login` has been run (CLI authenticated).
 *   2. Each app is linked: `cd apps/<app> && vercel link --yes --project <name> --scope marketstandard`
 *      (creates `apps/<app>/.vercel/project.json`).
 *   3. Shared secrets are exported in the current shell:
 *        STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
 *        NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * The script:
 *   - Reads each app's `.env.example`.
 *   - Resolves `STRIPE_PRICE_*` placeholders to the real price IDs from the root `.env.example`.
 *   - Resolves shared-secret placeholders (empty values) from the current process env.
 *   - Calls `vercel env add <KEY> production preview development` with the resolved value.
 *   - Skips vars that already exist on the Vercel project (CLI handles idempotency).
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, basename } from "node:path";

const ROOT = resolve(__dirname, "..");
const APPS_DIR = resolve(ROOT, "apps");

interface EnvVar {
  key: string;
  value: string;
}

function parseEnvFile(filePath: string): EnvVar[] {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, "utf8");
  const vars: EnvVar[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    vars.push({ key, value });
  }
  return vars;
}

function loadRootPriceIds(): Record<string, string> {
  const rootEnv = parseEnvFile(resolve(ROOT, ".env.example"));
  const priceMap: Record<string, string> = {};
  for (const { key, value } of rootEnv) {
    if (key.startsWith("STRIPE_PRICE_") && value && !value.endsWith("...")) {
      priceMap[key] = value;
    }
  }
  return priceMap;
}

const SHARED_SECRET_KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
];

function resolveValue(key: string, placeholder: string, priceIds: Record<string, string>): string | null {
  // STRIPE_PRICE_* → resolve from root .env.example
  if (key.startsWith("STRIPE_PRICE_")) {
    const resolved = priceIds[key];
    if (!resolved || resolved.endsWith("...")) {
      console.warn(`  ⚠️  ${key} has no real price ID in root .env.example — skipping`);
      return null;
    }
    return resolved;
  }

  // Shared secrets → resolve from process.env
  if (SHARED_SECRET_KEYS.includes(key)) {
    const fromEnv = process.env[key];
    if (!fromEnv) {
      console.warn(`  ⚠️  ${key} not set in current shell env — skipping (export it first)`);
      return null;
    }
    return fromEnv;
  }

  // Non-empty literal values (e.g., NEXT_PUBLIC_APP_URL=http://localhost:3001, DB_GATEWAY_URL)
  if (placeholder && !placeholder.includes("...")) {
    return placeholder;
  }

  // Empty placeholder → skip (app-specific secret the user must fill in manually)
  if (!placeholder) {
    console.warn(`  ⚠️  ${key} is empty in .env.example — skipping (set manually if needed)`);
    return null;
  }

  return null;
}

function isAppLinked(appDir: string): boolean {
  return existsSync(resolve(appDir, ".vercel", "project.json"));
}

function pushEnvVar(appDir: string, key: string, value: string): boolean {
  try {
    // Pipe the value to `vercel env add` for all 3 environments.
    // --sensitive marks it as encrypted (not shown in logs) for non-public vars.
    const isPublic = key.startsWith("NEXT_PUBLIC_");
    const sensitiveFlag = isPublic ? "" : "--sensitive";
    const cmd = `echo ${JSON.stringify(value)} | vercel env add ${key} production preview development ${sensitiveFlag} 2>&1`;
    const output = execSync(cmd, { cwd: appDir, stdio: ["pipe", "pipe", "pipe"], encoding: "utf8" });
    if (output.includes("already exists") || output.includes("Duplicate")) {
      console.log(`  ✓ ${key} (already exists, skipped)`);
    } else {
      console.log(`  ✓ ${key} (created)`);
    }
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists") || msg.includes("Duplicate")) {
      console.log(`  ✓ ${key} (already exists, skipped)`);
      return true;
    }
    console.error(`  ✗ ${key} failed: ${msg.split("\n")[0]}`);
    return false;
  }
}

async function main() {
  const priceIds = loadRootPriceIds();
  console.log(`Loaded ${Object.keys(priceIds).length} Stripe price IDs from root .env.example\n`);

  // Discover all app directories with a .env.example
  const appDirs: string[] = [];
  for (const entry of readdirSync(APPS_DIR)) {
    const full = resolve(APPS_DIR, entry);
    if (statSync(full).isDirectory() && existsSync(resolve(full, ".env.example"))) {
      appDirs.push(full);
    }
  }
  appDirs.sort();

  let linkedCount = 0;
  let unlinkedCount = 0;

  for (const appDir of appDirs) {
    const appName = basename(appDir);
    console.log(`\n=== ${appName} ===`);

    if (!isAppLinked(appDir)) {
      console.log("  ⚠️  Not linked to Vercel. Run:");
      console.log(`     cd apps/${appName} && vercel link --yes --project ${appName} --scope marketstandard`);
      unlinkedCount++;
      continue;
    }
    linkedCount++;

    const envVars = parseEnvFile(resolve(appDir, ".env.example"));
    let pushed = 0;
    for (const { key, value: placeholder } of envVars) {
      const resolved = resolveValue(key, placeholder, priceIds);
      if (resolved === null) continue;
      if (pushEnvVar(appDir, key, resolved)) pushed++;
    }
    console.log(`  Pushed ${pushed}/${envVars.length} env vars`);
  }

  console.log(`\nDone. ${linkedCount} linked, ${unlinkedCount} unlinked.`);
  if (unlinkedCount > 0) {
    console.log("\nTo link unlinked apps, run for each:");
    console.log("  cd apps/<app> && vercel link --yes --project <app> --scope marketstandard");
    console.log("Then re-run: pnpm vercel:setup-envs");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
