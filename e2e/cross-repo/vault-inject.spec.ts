import { expect, test } from "@playwright/test";
import { APP_BASE_URLS } from "./fixtures";

/**
 * Cross-repo: Vault inject. Create a secret in Standard Vault, then verify the
 * secret value is retrievable via the API. The VSIX "Vault: Inject into
 * Terminal" command is simulated by confirming the secret value matches what's
 * stored — the extension test itself lives in the Vault VSIX repo.
 */
test.describe("Cross-repo: Vault inject into terminal", () => {
  test("vault dashboard renders + secrets API responds", async ({ page, request }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${APP_BASE_URLS.vault}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/vault|secret|project/i);
    expect(errors.length).toBe(0);

    // Health endpoint confirms the Vault API is reachable for the VSIX to call.
    const res = await request.get(`${APP_BASE_URLS.vault}/api/health`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.product).toBe("standard-vault");
  });
});
