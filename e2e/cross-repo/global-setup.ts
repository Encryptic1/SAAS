/**
 * Phase 12: cross-repo global setup. Verifies the 14-app local dev stack +
 * gateway are healthy before running the 18 cross-repo spec scenarios. Reuses
 * the existing dev stack when present; does NOT spawn a new one (the regular
 * `e2e/global-setup.ts` is responsible for spawning). Cross-repo tests should
 * be run after `pnpm dev:local` is already up.
 */
import { REQUIRED_APPS, APP_BASE_URLS } from "./fixtures";
import { appHealthy } from "./helpers";

export default async function globalSetup(): Promise<void> {
  console.log("[cross-repo] Verifying dev stack health…");
  const unhealthy: string[] = [];
  for (const app of REQUIRED_APPS) {
    if (!(await appHealthy(app))) unhealthy.push(app);
  }
  if (!(await appHealthy("gateway"))) unhealthy.push("gateway");

  if (unhealthy.length > 0) {
    console.error(`[cross-repo] Stack not ready. Unhealthy: ${unhealthy.join(", ")}`);
    console.error("[cross-repo] Start the stack first with: pnpm dev:local");
    process.exit(1);
  }
  console.log(`[cross-repo] Dev stack ready (${REQUIRED_APPS.length} apps + gateway).`);
  console.log(`[cross-repo] Base URLs: ${Object.entries(APP_BASE_URLS).map(([k, v]) => `${k}=${v}`).join(", ")}`);
}
