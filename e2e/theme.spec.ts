import { expect, test } from "@playwright/test";
import { expectDarkTheme, gotoNoErrors, ROUTES } from "./helpers";

for (const route of ROUTES) {
  test(`${route.name} — dark theme and no errors`, async ({ page }) => {
    await gotoNoErrors(page, route.url, route.name);
    await expectDarkTheme(page, route.name);

    if ("marketing" in route && route.marketing) {
      await expect(page.locator(".ms-marketing").first()).toBeVisible();
    }
    if ("app" in route && route.app) {
      await expect(page.locator(".ms-app").first()).toBeVisible();
    }
    if (route.name.includes("dashboard")) {
      await expect(page.locator(".ms-panel").first()).toBeVisible();
    }
  });
}
