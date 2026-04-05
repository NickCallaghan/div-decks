import { test, expect } from "@playwright/test";

test.describe("Presentation mode", () => {
  async function openPresentationAndPlay(
    page: import("@playwright/test").Page,
  ) {
    await page.goto("/");
    // Open first file
    await page.locator(".file-item").first().click();
    await expect(page.locator(".editor-canvas__iframe")).toBeVisible();

    // Click the Play button in the toolbar
    const playButton = page.locator('button[title="Present (Play)"]');
    await expect(playButton).toBeVisible();
    await playButton.click();

    // Wait for presentation overlay to appear
    const overlay = page.locator('[data-testid="presentation-mode"]');
    await expect(overlay).toBeVisible({ timeout: 5000 });
    return overlay;
  }

  test("close button exits presentation mode", async ({ page }) => {
    const overlay = await openPresentationAndPlay(page);

    // Click the close button
    const closeButton = overlay.locator('button[title="Exit presentation"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Presentation overlay should be gone
    await expect(overlay).not.toBeVisible({ timeout: 3000 });

    // Editor should be visible again
    await expect(page.locator(".editor-canvas__iframe")).toBeVisible();
  });

  test("close button works after clicking inside iframe", async ({ page }) => {
    const overlay = await openPresentationAndPlay(page);

    // Click inside the presentation iframe to give it focus
    const iframe = overlay.locator("iframe");
    await iframe.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(200);

    // Click the close button
    const closeButton = overlay.locator('button[title="Exit presentation"]');
    await closeButton.click();

    // Presentation overlay should be gone
    await expect(overlay).not.toBeVisible({ timeout: 3000 });
  });

  test("can re-enter presentation mode after exiting", async ({ page }) => {
    // First enter and exit via close button
    const overlay = await openPresentationAndPlay(page);
    const closeButton = overlay.locator('button[title="Exit presentation"]');
    await closeButton.click();
    await expect(overlay).not.toBeVisible({ timeout: 3000 });

    // Re-enter
    const playButton = page.locator('button[title="Present (Play)"]');
    await playButton.click();
    const overlay2 = page.locator('[data-testid="presentation-mode"]');
    await expect(overlay2).toBeVisible({ timeout: 5000 });

    // Exit again
    const closeButton2 = overlay2.locator('button[title="Exit presentation"]');
    await closeButton2.click();
    await expect(overlay2).not.toBeVisible({ timeout: 3000 });
  });
});
