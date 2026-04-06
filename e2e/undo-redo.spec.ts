import { test, expect } from "@playwright/test";
import {
  openFirstPresentation,
  slideFrame,
  waitForSlideReady,
} from "./helpers";

test.describe("Undo / Redo", () => {
  test.beforeEach(async ({ page }) => {
    await openFirstPresentation(page);
    await waitForSlideReady(page);
  });

  test("undo restores previous state after edit", async ({ page }) => {
    const frame = slideFrame(page);
    const paragraph = frame.locator("p").first();

    // Get original text
    const originalText = await paragraph.textContent();

    // Enter edit mode and type
    await paragraph.click();
    await page.waitForTimeout(500);
    await paragraph.click();
    await page.waitForTimeout(500);
    await page.keyboard.press("End");
    await page.keyboard.type("UNDO_TEST");
    await page.waitForTimeout(300);

    // Exit edit mode to commit the change
    await frame
      .locator(".slide")
      .first()
      .click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(500);

    // Undo
    const undoBtn = page.locator('button[title="Undo (Cmd+Z)"]');
    await expect(undoBtn).toBeEnabled();
    await undoBtn.click();

    // Wait for the iframe to re-render
    await waitForSlideReady(page);

    // Text should be restored
    const restoredText = await frame.locator("p").first().textContent();
    expect(restoredText).toBe(originalText);
  });

  test("redo re-applies after undo", async ({ page }) => {
    const frame = slideFrame(page);
    const paragraph = frame.locator("p").first();

    // Enter edit mode and type
    await paragraph.click();
    await page.waitForTimeout(500);
    await paragraph.click();
    await page.waitForTimeout(500);
    await page.keyboard.press("End");
    await page.keyboard.type("REDO_TEST");
    await page.waitForTimeout(300);

    // Exit edit mode
    await frame
      .locator(".slide")
      .first()
      .click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(500);

    // Undo
    await page.locator('button[title="Undo (Cmd+Z)"]').click();
    await waitForSlideReady(page);

    // Redo
    const redoBtn = page.locator('button[title="Redo (Cmd+Shift+Z)"]');
    await expect(redoBtn).toBeEnabled();
    await redoBtn.click();
    await waitForSlideReady(page);

    // Text should contain the edit again
    await expect(frame.locator("p").first()).toContainText("REDO_TEST");
  });

  test("undo button disabled state tracks history", async ({ page }) => {
    const undoBtn = page.locator('button[title="Undo (Cmd+Z)"]');
    const redoBtn = page.locator('button[title="Redo (Cmd+Shift+Z)"]');

    // Initially both disabled
    await expect(undoBtn).toBeDisabled();
    await expect(redoBtn).toBeDisabled();

    // Make an edit
    const frame = slideFrame(page);
    const paragraph = frame.locator("p").first();
    await paragraph.click();
    await page.waitForTimeout(500);
    await paragraph.click();
    await page.waitForTimeout(500);
    await page.keyboard.type("X");
    await page.waitForTimeout(300);

    // Exit edit mode
    await frame
      .locator(".slide")
      .first()
      .click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(500);

    // Undo should be enabled, redo still disabled
    await expect(undoBtn).toBeEnabled();
    await expect(redoBtn).toBeDisabled();

    // Undo
    await undoBtn.click();
    await page.waitForTimeout(500);

    // Now redo should be enabled, undo disabled
    await expect(undoBtn).toBeDisabled();
    await expect(redoBtn).toBeEnabled();
  });
});
