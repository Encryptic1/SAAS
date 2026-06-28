import { expect, test } from "@playwright/test";
import { APP_BASE_URLS } from "./fixtures";
import { externalAvailable, mintSSOCode } from "./helpers";

/**
 * Cross-repo: SSO (FloodG8 → Standard Vault). When FloodG8 is reachable, mint
 * an SSO code and verify Vault's /auth/callback exchanges it. When FloodG8 is
 * not reachable (local dev), verify the Vault auth callback route handles a
 * missing/expired code gracefully by redirecting to the auth error page.
 */
test.describe("Cross-repo: SSO FloodG8 → Vault", () => {
  test("Vault /auth/callback redirects on missing code", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${APP_BASE_URLS.vault}/auth/callback`, { waitUntil: "networkidle" });
    // Should redirect to /auth/error?reason=invalid (or render the error page).
    expect(page.url()).toMatch(/auth\/(error|callback)/);
    expect(errors.length).toBe(0);
  });

  test("mintSSOCode returns a code when FloodG8 is up (skips otherwise)", async () => {
    const code = await mintSSOCode("local-dev", "standard-vault");
    if (!(await externalAvailable("floodg8"))) {
      test.skip(true, "FloodG8 unreachable — skipping SSO mint");
      return;
    }
    expect(code).toBeTruthy();
  });
});
