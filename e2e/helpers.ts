import { expect, type Page } from "@playwright/test";

/** Open the first presentation in the file browser */
export async function openFirstPresentation(page: Page) {
  await page.goto("/");
  await page.locator(".file-item").first().click();
  await expect(page.locator(".editor-canvas__iframe")).toBeVisible();
}

/** Get a FrameLocator for the slide iframe */
export function slideFrame(page: Page) {
  return page.frameLocator(".editor-canvas__iframe");
}

/** Wait for the bridge script inside the iframe to initialise */
export async function waitForSlideReady(page: Page) {
  const frame = slideFrame(page);
  await frame.locator(".slide").first().waitFor({ state: "visible" });
  // Bridge script needs a moment to attach its event listeners
  await page.waitForTimeout(400);
}
