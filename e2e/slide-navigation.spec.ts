import { test, expect } from "@playwright/test";
import { openFirstPresentation, waitForSlideReady } from "./helpers";

test.describe("Slide navigation", () => {
  test.beforeEach(async ({ page }) => {
    await openFirstPresentation(page);
    await waitForSlideReady(page);
  });

  test("next/prev buttons navigate slides", async ({ page }) => {
    const counter = page
      .locator('button[title="Previous slide"]')
      .locator("..");

    // Should start at slide 1
    await expect(counter).toContainText("1 /");

    // Click next
    await page.locator('button[title="Next slide"]').click();
    await expect(counter).toContainText("2 /");

    // Click previous
    await page.locator('button[title="Previous slide"]').click();
    await expect(counter).toContainText("1 /");
  });

  test("previous button is disabled on first slide", async ({ page }) => {
    const prevBtn = page.locator('button[title="Previous slide"]');
    await expect(prevBtn).toBeDisabled();
  });

  test("undo button is disabled before any edits", async ({ page }) => {
    const undoBtn = page.locator('button[title="Undo (Cmd+Z)"]');
    await expect(undoBtn).toBeDisabled();
  });
});
