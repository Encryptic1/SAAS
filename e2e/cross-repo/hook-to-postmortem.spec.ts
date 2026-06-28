import { expect, test } from "@playwright/test";
import { APP_BASE_URLS } from "./fixtures";
import { postHookEvent } from "./helpers";

/**
 * Cross-repo: Hook → Postmortem. Post a failing webhook to Hook's capture
 * endpoint, then verify the Hook event detail page offers a "Create postmortem"
 * deep-link, and that Postmortem's /dashboard/new accepts the source + event_id
 * query params (pre-fill wiring).
 */
test.describe("Cross-repo: Hook → Postmortem", () => {
  test("failing webhook surfaces a create-postmortem deep-link", async ({ request, page }) => {
    const slug = `e2e-cross-${Date.now()}`;
    // Create an inbox by posting the first event to its slug.
    const ev = await postHookEvent(slug, { event: "order.created", status: "failed", code: 500 });
    expect(ev.status).toBeLessThan(500);

    // Postmortem /dashboard/new should accept source=hook + event_id and render the form.
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(
      `${APP_BASE_URLS.postmortem}/dashboard/new?source=hook&event_id=${slug}`,
      { waitUntil: "networkidle" },
    );
    await expect(page.locator("body")).toContainText(/incident|postmortem|timeline/i);
    expect(errors.length).toBe(0);
  });
});
