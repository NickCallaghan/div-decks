# Playwright E2E Testing & Claude Verification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Playwright E2E testing with smoke tests, and add CLAUDE.md instructions for browser-based verification of UI changes.

**Architecture:** Playwright test runner with a `webServer` config that auto-starts the dev server. Smoke tests verify app loads, file browser works, presentations open, and slide navigation works. CLAUDE.md gets a new verification workflow section.

**Tech Stack:** `@playwright/test`, Chromium

---

### Task 1: Install Playwright and Configure

**Files:**

- Modify: `package.json` (add dev dependency and scripts)
- Create: `playwright.config.ts`

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
```

- [ ] **Step 2: Install Chromium browser**

```bash
npx playwright install chromium
```

- [ ] **Step 3: Create `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});
```

- [ ] **Step 4: Add npm scripts to `package.json`**

Add to the `"scripts"` section:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

- [ ] **Step 5: Add Playwright artifacts to `.gitignore`**

Append to `.gitignore`:

```
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json playwright.config.ts .gitignore
git commit -m "feat: add Playwright E2E test infrastructure"
```

---

### Task 2: Write Smoke Tests

**Files:**

- Create: `e2e/smoke.spec.ts`

Tests rely on `presentations/` containing at least one `.html` file (currently `tmnt-story.html` and `element-test.html` exist).

- [ ] **Step 1: Create `e2e/smoke.spec.ts` with all four smoke tests**

```ts
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
```

- [ ] **Step 2: Run the smoke tests**

```bash
npm run test:e2e
```

Expected: All 4 tests pass. If any fail, fix selectors or timing issues and re-run.

- [ ] **Step 3: Commit**

```bash
git add e2e/smoke.spec.ts
git commit -m "feat: add E2E smoke tests for app load, file browser, open, navigate"
```

---

### Task 3: Update CLAUDE.md

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: Add Verification Workflow section to CLAUDE.md**

Add this new section after the "Development Rules" section and before "Conventions":

```markdown
## Verification Workflow

After any UI-affecting change, Claude must verify the change works before claiming completion:

1. **Ensure the dev server is running** (`npm run dev`). Start it if it's not.
2. **Open the app in the browser** using Playwright MCP tools — `browser_navigate` to `http://localhost:5173`.
3. **Visually verify the change** — use `browser_snapshot` to inspect the DOM/accessibility tree, `browser_take_screenshot` for visual checks, and `browser_click`/`browser_fill_form` to test interactions.
4. **Iterate until it works** — if something looks wrong or broken, fix the code and re-verify. Do not move on until the change is confirmed working.
5. **Write or update E2E tests** — add tests in `e2e/` that cover the change. The E2E suite should grow with each feature.
6. **Run all tests** — both `npm test` (unit) and `npm run test:e2e` (E2E) must pass before claiming done.

Do not skip browser verification. Do not claim UI work is complete based only on unit tests passing.
```

- [ ] **Step 2: Update the Commands table**

Add these two rows to the existing commands table:

```markdown
| `npm run test:e2e` | Playwright E2E tests |
| `npm run test:e2e:ui`| Playwright E2E tests (UI mode) |
```

- [ ] **Step 3: Update the Testing section**

Update the Testing section to mention E2E tests:

````markdown
## Testing

```bash
npm test           # Run unit tests once
npm run test:watch # Unit test watch mode
npm run test:e2e   # Run E2E tests (starts dev server automatically)
```
````

Unit tests cover parser, serializer (including round-trip), and store (undo/redo, reorder, selection).
E2E tests cover app loading, file browsing, presentation opening, and slide navigation.

````

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add verification workflow and E2E commands to CLAUDE.md"
````

---

### Task 4: Verify Everything Works End-to-End

- [ ] **Step 1: Run unit tests**

```bash
npm test
```

Expected: All existing tests pass.

- [ ] **Step 2: Run E2E tests**

```bash
npm run test:e2e
```

Expected: All 4 smoke tests pass.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: TypeScript type-check and Vite build succeed (playwright.config.ts should not cause type errors).
