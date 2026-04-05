import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("app loads with main layout", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".app-shell")).toBeVisible();
    await expect(page.locator(".app-sidebar")).toBeVisible();
    await expect(page.locator(".app-main")).toBeVisible();
    await expect(page.locator(".app-toolbar")).toBeVisible();
  });

  test("file browser lists presentations", async ({ page }) => {
    await page.goto("/");
    const fileItems = page.locator(".file-item");
    await expect(fileItems.first()).toBeVisible();
    const count = await fileItems.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // At least one file name should be visible
    await expect(page.locator(".file-item__name").first()).toBeVisible();
  });

  test("clicking a file opens a presentation", async ({ page }) => {
    await page.goto("/");
    const firstFile = page.locator(".file-item").first();
    await firstFile.click();

    // Editor canvas should show with an iframe containing the slide
    await expect(page.locator(".editor-canvas__iframe")).toBeVisible();
  });

  test("clicking a slide thumbnail navigates to that slide", async ({
    page,
  }) => {
    await page.goto("/");

    // Open a presentation first
    await page.locator(".file-item").first().click();
    await expect(page.locator(".editor-canvas__iframe")).toBeVisible();

    // Wait for thumbnails to render
    const thumbnails = page.locator(".slide-thumbnail");
    await expect(thumbnails.first()).toBeVisible();

    // If there's more than one slide, click the second thumbnail
    const count = await thumbnails.count();
    if (count > 1) {
      const secondThumb = thumbnails.nth(1);
      await secondThumb.click();
      await expect(secondThumb).toHaveClass(/slide-thumbnail--active/);
    }
  });
});
