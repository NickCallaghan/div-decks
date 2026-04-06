import { test, expect } from "@playwright/test";
import {
  openFirstPresentation,
  slideFrame,
  waitForSlideReady,
} from "./helpers";

test.describe("Save workflow", () => {
  test.beforeEach(async ({ page }) => {
    await openFirstPresentation(page);
    await waitForSlideReady(page);
  });

  test("save button is disabled when file is clean", async ({ page }) => {
    const saveBtn = page.locator('button[title="Save (Cmd+S)"]');
    await expect(saveBtn).toBeDisabled();
  });

  test("dirty indicator lifecycle: edit → dirty → save → clean", async ({
    page,
  }) => {
    const frame = slideFrame(page);
    const paragraph = frame.locator("p").first();

    // No dirty indicator initially
    const saveBtn = page.locator('button[title="Save (Cmd+S)"]');
    await expect(saveBtn).toBeDisabled();

    // Enter edit mode: click to select, click again to edit
    await paragraph.click();
    await page.waitForTimeout(500);
    await paragraph.click();
    await page.waitForTimeout(500);
    await page.keyboard.type("Z");
    await page.waitForTimeout(300);

    // Exit edit mode by pressing Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Save button should now be enabled
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });

    // Click save
    await saveBtn.click();

    // Save button should be disabled again
    await expect(saveBtn).toBeDisabled();

    // Toast should appear
    const toast = page.locator('[data-testid="toast"]');
    await expect(toast.first()).toBeVisible({ timeout: 3000 });
  });
});
