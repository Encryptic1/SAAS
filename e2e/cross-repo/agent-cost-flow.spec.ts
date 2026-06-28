import { expect, test } from "@playwright/test";
import { externalAvailable } from "./helpers";

/**
 * Cross-repo: Agent cost flow. `ms-agent cost` CLI parses a Claude session.jsonl
 * and POSTs to FloodG8 /api/portfolio/agent-cost. The FloodG8 side skips when
 * FloodG8 is unreachable; the CLI itself lives in the agent-skill repo.
 */
test.describe("Cross-repo: Agent cost flow", () => {
  test("agent-cost endpoint is reachable when FloodG8 is up (skips otherwise)", async () => {
    if (!(await externalAvailable("floodg8"))) {
      test.skip(true, "FloodG8 unreachable — skipping agent-cost flow");
      return;
    }
    const res = await fetch("https://floodg8.com/api/portfolio/agent-cost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionPath: "test.jsonl", costUsd: 0.42 }),
      signal: AbortSignal.timeout(8_000),
    }).catch(() => null);
    expect(res).not.toBeNull();
  });
});
