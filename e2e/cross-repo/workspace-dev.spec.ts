import { expect, test } from "@playwright/test";
import { APP_BASE_URLS } from "./fixtures";
import { startWorkspaceSession, stopWorkspaceSession } from "./helpers";

/**
 * Cross-repo: Workspace dev session. Start a session via the Workspace API,
 * verify it appears on /dashboard/sessions, tail the SSE log stream, and stop
 * it cleanly.
 */
test.describe("Cross-repo: Workspace dev session", () => {
  test("start → list → SSE logs → stop a dev session", async ({ page, request }) => {
    const id = await startWorkspaceSession(`cross-repo ${Date.now()}`, "standard-polls,standard-metrics");
    expect(id).toBeTruthy();

    // Sessions dashboard lists the new session. Use domcontentloaded — the
    // SSE log viewer on the page keeps the network active, so networkidle never fires.
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${APP_BASE_URLS.workspace}/dashboard/sessions`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toContainText(/dev session/i);
    expect(errors.length).toBe(0);

    // SSE log stream emits at least the initial handshake lines. Open an
    // EventSource in the browser and collect the first `log` event — this
    // verifies the SSE wiring end-to-end without hanging on the streaming body
    // (Playwright's `request.get` waits for the body to complete, which never
    // happens for an SSE stream).
    const firstLog = await page.evaluate(async (sid) => {
      return new Promise<string | null>((resolve) => {
        const es = new EventSource(`/api/sessions/${sid}/logs`);
        const onLog = (e: MessageEvent) => {
          es.removeEventListener("log", onLog as EventListener);
          es.close();
          resolve(typeof e.data === "string" ? e.data : null);
        };
        es.addEventListener("log", onLog as EventListener);
        setTimeout(() => {
          es.removeEventListener("log", onLog as EventListener);
          es.close();
          resolve(null);
        }, 8_000);
      });
    }, id);
    expect(firstLog).toBeTruthy();

    // Stop the session cleanly.
    const stopped = await stopWorkspaceSession(id);
    expect(stopped).toBe(true);
  });
});
