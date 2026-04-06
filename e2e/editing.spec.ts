import { test, expect } from "@playwright/test";
import {
  openFirstPresentation,
  slideFrame,
  waitForSlideReady,
} from "./helpers";

test.describe("Element editing", () => {
  test.beforeEach(async ({ page }) => {
    await openFirstPresentation(page);
    await waitForSlideReady(page);
  });

  test("clicking an element in the slide selects it", async ({ page }) => {
    const frame = slideFrame(page);

    // Click a paragraph inside the iframe (less likely to have child spans)
    await frame.locator("p").first().click();

    // Deselect button should appear in toolbar (proves something is selected)
    await expect(page.locator('button[title="Deselect (Esc)"]')).toBeVisible();
  });

  test("pressing Escape deselects the element", async ({ page }) => {
    const frame = slideFrame(page);

    await frame.locator("p").first().click();
    const deselectBtn = page.locator('button[title="Deselect (Esc)"]');
    await expect(deselectBtn).toBeVisible();

    await page.keyboard.press("Escape");

    // Selection indicator should disappear
    await expect(deselectBtn).not.toBeVisible();
  });

  test("double-click enters edit mode and typing modifies content", async ({
    page,
  }) => {
    const frame = slideFrame(page);
    const paragraph = frame.locator("p").first();

    // First click to select
    await paragraph.click();
    await page.waitForTimeout(500);

    // Second click to enter edit mode
    await paragraph.click();
    await page.waitForTimeout(500);

    // Type something — the status bar should show "(editing)"
    await page.keyboard.type("E2E");
    await page.waitForTimeout(300);

    // Verify text was inserted
    await expect(paragraph).toContainText("E2E");
  });

  test("editing text and exiting makes the file dirty", async ({ page }) => {
    const frame = slideFrame(page);
    const paragraph = frame.locator("p").first();

    // Enter edit mode: click to select, click again to edit
    await paragraph.click();
    await page.waitForTimeout(500);
    await paragraph.click();
    await page.waitForTimeout(500);

    // Type something
    await page.keyboard.type("DIRTY");
    await page.waitForTimeout(300);

    // Exit edit mode by clicking elsewhere in the slide
    await frame
      .locator(".slide")
      .first()
      .click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(500);

    // Save button should be enabled (file is dirty)
    const saveBtn = page.locator('button[title="Save (Cmd+S)"]');
    await expect(saveBtn).toBeEnabled();
  });
});
