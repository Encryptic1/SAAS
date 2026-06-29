import { execSync, spawn } from "node:child_process";
import * as fs from "node:fs";
import { HEALTH_URLS, ROOT, STATE_FILE } from "./stack-constants";

async function isHealthy(): Promise<boolean> {
  // Retry a few times so a transient HMR blip on one app does not trigger the
  // destructive spawn branch (which reseeds PGlite while the gateway holds it).
  for (let attempt = 0; attempt < 3; attempt++) {
    let failed = false;
    for (const url of HEALTH_URLS) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
        if (!res.ok) {
          failed = true;
          break;
        }
      } catch {
        failed = true;
        break;
      }
    }
    if (!failed) return true;
    await new Promise((r) => setTimeout(r, 4_000));
  }
  return false;
}

async function gatewayUp(): Promise<boolean> {
  try {
    const res = await fetch("http://127.0.0.1:4000/health", { signal: AbortSignal.timeout(5_000) });
    return res.ok;
  } catch {
    return false;
  }
}

const LOCAL_DEV_ENV = {
  ...process.env,
  NEXT_PUBLIC_LOCAL_DEV: "true",
  LOCAL_DEV: "true",
};

function waitForUrls(urls: readonly string[], timeoutMs: number): void {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const allOk = urls.every((url) => {
      try {
        execSync(`node -e "fetch('${url}').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"`, {
          cwd: ROOT,
          stdio: "ignore",
          timeout: 5_000,
        });
        return true;
      } catch {
        return false;
      }
    });
    if (allOk) return;
    execSync('node -e "setTimeout(()=>{}, 1000)"', { stdio: "ignore" });
  }
  throw new Error(`Timed out waiting for: ${urls.join(", ")}`);
}

function spawnDetached(command: string, args: string[], env?: NodeJS.ProcessEnv): number {
  const child = spawn(command, args, {
    cwd: ROOT,
    shell: true,
    detached: true,
    stdio: "ignore",
    env: env ?? process.env,
  });
  child.unref();
  return child.pid ?? 0;
}

export default async function globalSetup(): Promise<void> {
  if (await isHealthy()) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ spawned: false }));
    console.log("[e2e] Reusing existing dev stack on :4000, :3001-:3014");
    return;
  }

  console.log("[e2e] Starting dev stack…");
  // Only reseed when the gateway is not already running — reseed while the
  // gateway holds the PGlite dir can lock/crash the in-flight stack.
  let gatewayPid = 0;
  if (!(await gatewayUp())) {
    execSync("pnpm db:setup", { cwd: ROOT, stdio: "inherit" });
    gatewayPid = spawnDetached("pnpm", ["db:server"], LOCAL_DEV_ENV);
    waitForUrls(["http://127.0.0.1:4000/health"], 30_000);
  }

  const appsPid = spawnDetached(
    "pnpm",
    [
      "exec",
      "cross-env",
      "NEXT_PUBLIC_LOCAL_DEV=true",
      "LOCAL_DEV=true",
      "turbo",
      "run",
      "dev",
      "--concurrency=14",
      "--filter=standard-polls",
      "--filter=standard-proof",
      "--filter=standard-metrics",
      "--filter=standard-hook",
      "--filter=standard-release",
      "--filter=standard-vault",
      "--filter=standard-links",
      "--filter=standard-snippets",
      "--filter=standard-status",
      "--filter=standard-regex",
      "--filter=standard-postmortem",
      "--filter=standard-lens",
      "--filter=standard-cron",
      "--filter=standard-workspace",
    ],
    LOCAL_DEV_ENV,
  );
  waitForUrls(
    [
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
      "http://localhost:3005",
      "http://localhost:3006",
      "http://localhost:3007",
      "http://localhost:3008",
      "http://localhost:3009",
      "http://localhost:3010",
      "http://localhost:3011",
      "http://localhost:3012",
      "http://localhost:3013",
      "http://localhost:3014",
    ],
    240_000,
  );

  fs.writeFileSync(STATE_FILE, JSON.stringify({ spawned: true, pids: [gatewayPid, appsPid] }));
  console.log("[e2e] Dev stack ready (14 apps + gateway)");
}
