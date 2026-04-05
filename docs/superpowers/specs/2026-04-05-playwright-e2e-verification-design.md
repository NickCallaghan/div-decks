# Playwright E2E Testing & Claude Verification Workflow

## Problem

Claude has no way to verify that UI changes actually work. It writes code, runs unit tests, and hopes for the best. For a visual editor like div.deck, this is insufficient — layout bugs, broken interactions, and rendering issues slip through because unit tests can't catch them.

## Solution

Two complementary systems:

1. **Playwright MCP browser** (already available) — Claude's primary verification tool. After any UI change, Claude opens the app in the browser, visually inspects it, interacts with it, and iterates until it works.
2. **Playwright E2E test suite** — captures verified behavior as repeatable tests. After Claude confirms something works via the browser, it writes or updates E2E tests to lock in that state.

## Claude's Verification Workflow

After any UI-affecting change:

1. **Verify with MCP browser** — navigate to `http://localhost:5173`, take screenshots, click elements, confirm the change works visually and functionally. Iterate (fix code, re-check) until satisfied.
2. **Write/update E2E tests** — add or update tests in `e2e/` that cover what was changed.
3. **Run all tests** — `npm test` (unit) and `npm run test:e2e` (E2E) must both pass before claiming work is complete.

This is mandatory, not optional. Claude must not claim UI work is done without browser verification.

## E2E Test Setup

### Dependencies

- `@playwright/test` (dev dependency)
- Chromium browser (installed via `npx playwright install chromium`)

### Configuration — `playwright.config.ts`

- Base URL: `http://localhost:5173`
- Single browser: Chromium
- `webServer` block: runs `npm run dev` and waits for port 5173
- Test directory: `e2e/`
- Retries: 0 in dev, 1 in CI
- Screenshots on failure

### npm Scripts

| Script        | Command                |
| ------------- | ---------------------- |
| `test:e2e`    | `playwright test`      |
| `test:e2e:ui` | `playwright test --ui` |

### Directory Structure

```
e2e/
  smoke.spec.ts     — initial smoke tests
```

## Initial Smoke Tests — `e2e/smoke.spec.ts`

Four tests that verify the app fundamentally works:

1. **App loads** — navigate to `/`, expect the main layout to be visible (editor canvas, file browser sidebar)
2. **File browser lists presentations** — sidebar shows `.html` files (at least `tmnt-story.html` exists in `presentations/`)
3. **Open a presentation** — click a file in the sidebar, expect slides to appear in the editor (iframe content renders)
4. **Navigate slides** — click a slide thumbnail in the overview panel, expect the active slide to change

These tests use existing presentation files in `presentations/` as test data. No fixtures needed.

## CLAUDE.md Changes

Add a new section to CLAUDE.md:

### Verification Workflow (new section)

Instructions for Claude to follow after any UI-affecting change:

- The dev server must be running (`npm run dev`)
- Use Playwright MCP tools (`browser_navigate`, `browser_snapshot`, `browser_take_screenshot`, `browser_click`, etc.) to open the app and verify changes
- Iterate: if something looks wrong or doesn't work, fix the code and re-verify
- Once verified, write or update E2E tests to cover the change
- Run `npm test` and `npm run test:e2e` — both must pass before claiming done

### Commands table (update existing)

Add `npm run test:e2e` and `npm run test:e2e:ui` to the commands table.

## What This Does NOT Cover

- CI integration (can add later)
- Multi-browser testing (Chromium only to start)
- Visual regression / screenshot comparison
- Coverage of all user journeys (just smoke tests initially — suite grows as features are built)
