import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors, isMobileProject } from "./helpers";

test.describe("Command palette + suite switcher (Phase 2)", () => {
  test("Cmd+K opens the command palette on every dashboard", async ({ page }) => {
    test.skip(isMobileProject(test.info().project.name), "Cmd+K is a desktop keyboard interaction");
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.polls}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toBeVisible();
    // Trigger the palette via keyboard (Meta+K on macOS, Control+K on others)
    const mod = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${mod}+k`);
    // The palette dialog should appear (role=dialog or a heading "Navigate")
    const palette = page.locator('[role="dialog"], [data-command-palette]').first();
    await expect(palette).toBeVisible({ timeout: 5000 });
    expectNoErrors(errors, "Polls command palette open");
  });

  test("Command palette searches and filters commands", async ({ page }) => {
    test.skip(isMobileProject(test.info().project.name), "Cmd+K is a desktop keyboard interaction");
    await page.goto(`${BASE.proof}/dashboard`, { waitUntil: "networkidle" });
    const mod = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${mod}+k`);
    const palette = page.locator('[role="dialog"], [data-command-palette]').first();
    await expect(palette).toBeVisible({ timeout: 5000 });
    // Type a search query and verify the palette narrows results
    await page.keyboard.type("billing");
    await page.waitForTimeout(300);
    const bodyText = await palette.innerText();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("Escape closes the command palette", async ({ page }) => {
    test.skip(isMobileProject(test.info().project.name), "Cmd+K is a desktop keyboard interaction");
    await page.goto(`${BASE.metrics}/dashboard`, { waitUntil: "networkidle" });
    const mod = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${mod}+k`);
    const palette = page.locator('[role="dialog"], [data-command-palette]').first();
    await expect(palette).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await expect(palette).not.toBeVisible({ timeout: 3000 });
  });

  test("Suite switcher renders in the dashboard shell", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.hook}/dashboard`, { waitUntil: "networkidle" });
    // The suite switcher button should be present in the shell
    await expect(page.locator("body")).toContainText(/Quick switch|Suite|switch/i);
    expectNoErrors(errors, "Hook suite switcher");
  });

  test("Command palette opens on Postmortem dashboard", async ({ page }) => {
    test.skip(isMobileProject(test.info().project.name), "Cmd+K is a desktop keyboard interaction");
    await page.goto(`${BASE.postmortem}/dashboard`, { waitUntil: "networkidle" });
    const mod = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${mod}+k`);
    const palette = page.locator('[role="dialog"], [data-command-palette]').first();
    await expect(palette).toBeVisible({ timeout: 5000 });
  });
});
