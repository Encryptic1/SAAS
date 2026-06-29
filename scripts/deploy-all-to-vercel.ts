/**
 * Deploy all 14 Market Standard apps to Vercel.
 *
 * Uses `cmd /c` for stdin redirection (PowerShell doesn't support `<`).
 * Handles "already exists" errors gracefully.
 *
 * Secrets NOT available via MCP (set to placeholder — user must replace
 * via Vercel dashboard):
 *   - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - SLACK_* (polls), STRIPE_CONNECT_CLIENT_ID (metrics)
 */
import { execSync, type ExecSyncOptions } from "node:child_process";
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const APPS_DIR = resolve(ROOT, "apps");
const SCOPE = "marketstandard";

const SUPABASE_URL = "https://opodtvblrelmpoaprmpr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wb2R0dmJscmVsbXBvYXBybXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NTEzNzcsImV4cCI6MjA5NzMyNzM3N30.2rt51sjnsb7bhtruDwYiv1H3m0seQz4tF8Nt_5X1DiE";

const PLACEHOLDER = "REPLACE_ME_VIA_VERCEL_DASHBOARD";

interface EnvVar { key: string; value: string }

function parseEnvFile(filePath: string): EnvVar[] {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, "utf8");
  const vars: EnvVar[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    vars.push({ key: trimmed.slice(0, eqIdx).trim(), value: trimmed.slice(eqIdx + 1).trim() });
  }
  return vars;
}

function loadRootPriceIds(): Record<string, string> {
  const rootEnv = parseEnvFile(resolve(ROOT, ".env.example"));
  const priceMap: Record<string, string> = {};
  for (const { key, value } of rootEnv) {
    if (key.startsWith("STRIPE_PRICE_") && value && !value.endsWith("...") && value.length > 5) {
      priceMap[key] = value;
    }
  }
  return priceMap;
}

const SHARED_SECRET_KEYS = new Set([
  "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
]);

function resolveEnvValue(key: string, placeholder: string, priceIds: Record<string, string>): string | null {
  if (key.startsWith("STRIPE_PRICE_")) {
    const resolved = priceIds[key];
    if (!resolved) return null;
    return resolved;
  }
  if (key === "NEXT_PUBLIC_SUPABASE_URL") return SUPABASE_URL;
  if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY") return SUPABASE_ANON_KEY;
  if (SHARED_SECRET_KEYS.has(key)) return PLACEHOLDER;
  if (key.startsWith("SLACK_") || key === "STRIPE_CONNECT_CLIENT_ID") return PLACEHOLDER;
  if (key === "NEXT_PUBLIC_APP_URL") return null; // set per-app
  if (!placeholder || placeholder.endsWith("...")) return null;
  return placeholder;
}

function run(cmd: string, opts: ExecSyncOptions = {}): { ok: boolean; output: string } {
  try {
    const output = execSync(cmd, { stdio: ["pipe", "pipe", "pipe"], encoding: "utf8", timeout: 60_000, ...opts });
    return { ok: true, output: output.trim() };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message: string };
    return { ok: false, output: (e.stderr ?? e.stdout ?? e.message).trim().slice(-400) };
  }
}

function setEnvVar(appDir: string, key: string, value: string, env: string): boolean {
  // Use cmd /c with pipe for stdin. Escape % for cmd.
  const escapedValue = value.replace(/%/g, "%%").replace(/"/g, '""');
  // echo|set /p= avoids trailing newline
  const cmd = `cmd /c "echo|set /p="${escapedValue}"|vercel env add ${key} ${env} --yes"`;
  const result = run(cmd, { cwd: appDir, timeout: 30_000 });
  // "already exists" is not a failure
  if (!result.ok && result.output.includes("already exists")) return true;
  return result.ok;
}

function main() {
  const priceIds = loadRootPriceIds();
  const apps = readdirSync(APPS_DIR).filter((d) => d.startsWith("standard-")).sort();
  const logDir = resolve(ROOT, "deploy-logs");
  mkdirSync(logDir, { recursive: true });

  const summary: Array<{ app: string; linked: boolean; envsSet: number; deployed: boolean; url: string }> = [];

  for (const app of apps) {
    const appDir = resolve(APPS_DIR, app);
    console.log(`\n=== ${app} ===`);

    // 1. Link
    const linkResult = run(`vercel link --yes --project ${app} --scope ${SCOPE}`, { cwd: appDir, timeout: 30_000 });
    const linked = linkResult.ok || linkResult.output.includes("already");
    console.log(`  link: ${linked ? "ok" : "FAIL — " + linkResult.output.slice(-150)}`);
    if (!linked) { summary.push({ app, linked: false, envsSet: 0, deployed: false, url: "" }); continue; }

    // 2. Env vars
    const appEnvVars = parseEnvFile(resolve(appDir, ".env.example"));
    const subdomain = app.replace("standard-", "");
    const prodUrl = `https://${subdomain}.marketstandard.io`;
    let envsSet = 0;

    for (const { key, value } of appEnvVars) {
      let resolved: string | null;
      if (key === "NEXT_PUBLIC_APP_URL") {
        resolved = prodUrl;
      } else {
        resolved = resolveEnvValue(key, value, priceIds);
      }
      if (!resolved) continue;

      let setCount = 0;
      for (const env of ["production", "preview", "development"]) {
        if (setEnvVar(appDir, key, resolved, env)) setCount++;
      }
      if (setCount > 0) envsSet++;
    }
    console.log(`  envs: ${envsSet} set`);

    // 3. Deploy
    const deployResult = run(`vercel --prod --yes`, { cwd: appDir, timeout: 300_000 });
    const deployed = deployResult.ok;
    const urlMatch = deployResult.output.match(/https:\/\/[^\s]+\.vercel\.app/);
    const url = urlMatch?.[0] ?? "";
    console.log(`  deploy: ${deployed ? "ok — " + url : "FAIL — " + deployResult.output.slice(-200)}`);
    summary.push({ app, linked, envsSet, deployed, url });
  }

  // Summary
  const lines = [
    "# Vercel Deployment Summary",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Team: ${SCOPE}`,
    "",
    "| App | Linked | Envs Set | Deployed | URL |",
    "|-----|--------|----------|----------|-----|",
    ...summary.map(s => `| ${s.app} | ${s.linked ? "yes" : "no"} | ${s.envsSet} | ${s.deployed ? "yes" : "no"} | ${s.url} |`),
    "",
    "## Secrets requiring manual setup",
    "",
    "The following were set to `REPLACE_ME_VIA_VERCEL_DASHBOARD` — replace via",
    "each project's Settings > Environment Variables:",
    "",
    "- `STRIPE_SECRET_KEY` (shared)",
    "- `STRIPE_WEBHOOK_SECRET` (per-app webhook signing secret)",
    "- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (shared)",
    "- `SUPABASE_SERVICE_ROLE_KEY` (shared, from Supabase dashboard)",
    "- `SLACK_BOT_TOKEN` / `SLACK_SIGNING_SECRET` / `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` (standard-polls)",
    "- `STRIPE_CONNECT_CLIENT_ID` (standard-metrics)",
    "",
  ];
  writeFileSync(resolve(logDir, "SUMMARY.md"), lines.join("\n"), "utf8");
  const ok = summary.filter(s => s.deployed).length;
  console.log(`\n${ok}/${apps.length} apps deployed. Summary: deploy-logs/SUMMARY.md`);
}

main();
