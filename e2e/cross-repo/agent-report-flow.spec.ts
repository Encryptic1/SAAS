import { expect, test } from "@playwright/test";
import { externalAvailable, postAgentReport } from "./helpers";

/**
 * Cross-repo: Agent report flow. `ms-agent report "..."` CLI POSTs to FloodG8
 * /api/portfolio/agent-report. When FloodG8 is reachable, verify the report is
 * accepted; otherwise skip.
 */
test.describe("Cross-repo: Agent report flow", () => {
  test("postAgentReport returns an id when FloodG8 is up (skips otherwise)", async () => {
    if (!(await externalAvailable("floodg8"))) {
      test.skip(true, "FloodG8 unreachable — skipping agent-report flow");
      return;
    }
    const report = await postAgentReport({ title: `E2E report ${Date.now()}`, body: "cross-repo test" });
    expect(report).not.toBeNull();
    expect(report?.id).toBeTruthy();
  });
});
