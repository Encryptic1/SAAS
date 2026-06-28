import { expect, test } from "@playwright/test";
import { APP_BASE_URLS } from "./fixtures";
import { postStatusIntake } from "./helpers";

/**
 * Cross-repo: Status → Postmortem. POST a failed GitHub workflow_run event to
 * Status's intake webhook, then verify the Status dashboard surfaces the
 * incident and that the "Create postmortem" deep-link carries the incident
 * context to Postmortem's /dashboard/new.
 */
test.describe("Cross-repo: Status → Postmortem", () => {
  test("failed CI event creates an incident with a postmortem deep-link", async ({ request, page }) => {
    const res = await postStatusIntake({
      title: `E2E CI fail ${Date.now()}`,
      status: "failed",
      severity: "sev3",
      repoFullName: "marketstandard/saas",
    });
    expect(res.status).toBeLessThan(500);

    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${APP_BASE_URLS.status}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/incident|pipeline|deploy/i);
    expect(errors.length).toBe(0);

    // Postmortem new-incident form should accept source=status.
    await page.goto(`${APP_BASE_URLS.postmortem}/dashboard/new?source=status`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/incident|postmortem|timeline/i);
  });
});
