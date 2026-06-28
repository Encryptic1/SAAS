import { execSync } from "node:child_process";
import * as fs from "node:fs";
import { STATE_FILE } from "./stack-constants";

export default async function globalTeardown(): Promise<void> {
  if (!fs.existsSync(STATE_FILE)) return;

  const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as {
    spawned?: boolean;
    pids?: number[];
  };

  if (!state.spawned || !state.pids?.length) {
    fs.unlinkSync(STATE_FILE);
    return;
  }

  console.log("[e2e] Stopping spawned dev stack…");
  for (const pid of state.pids) {
    if (!pid) continue;
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
      } else {
        process.kill(-pid, "SIGTERM");
      }
    } catch {
      // Process may already be gone
    }
  }

  fs.unlinkSync(STATE_FILE);
}
