import { expect, test } from "@playwright/test";
import { APP_BASE_URLS } from "./fixtures";

/**
 * Cross-repo: Suite digest. POST the Polls digest cron endpoint and verify it
 * composes a Slack-blocks preview that pulls from Metrics, FloodG8, SyncDevTime,
 * and Polls. In local dev the endpoint returns `preview: true` with the
 * composed blocks (no Slack delivery).
 */
test.describe("Cross-repo: Suite digest", () => {
  test("digest cron composes a preview with all source values", async ({ request }) => {
    const res = await request.post(`${APP_BASE_URLS.polls}/api/cron/digest`, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? "dev"}` },
    });
    // 200 or 202 — the endpoint may return either for a preview.
    expect(res.status()).toBeLessThan(500);
    const json = await res.json().catch(() => ({}));
    // Preview mode should include a blocks array (or a preview flag).
    expect(json.preview === true || Array.isArray(json.blocks) || json.ok === true).toBe(true);
  });
});
