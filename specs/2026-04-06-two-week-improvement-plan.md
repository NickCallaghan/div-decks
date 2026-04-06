# Two-Week Improvement Plan

**Created:** 2026-04-06
**Target version:** v0.5.0
**Starting from:** v0.3.4 (now at v0.4.0 after week 1)

## Current State Assessment

The project is well-structured — clean code, good specs, strict TypeScript, solid parser/serializer round-trip tests. Main weaknesses:

- **EditorToolbar.tsx is 537 LOC** — does too much (shortcuts, git status, nav, formatting)
- **Bridge script is 795 LOC** of string-template vanilla JS — hard to test, hard to refactor
- **E2E tests are smoke-only** — no editing workflow coverage
- **No React component tests**
- **No user-facing error handling** — fetch failures go to `console.error`
- **No slide management** — can't add/delete/duplicate slides
- **Accessibility is minimal** — no aria labels, no keyboard nav in slide overview

---

## Week 1: Foundation & Quality (COMPLETED — v0.4.0)

### 1. Toast/notification system — DONE

- Added `toast-store.ts`, `ToastContainer.tsx`, `useToast.ts`
- Replaced all silent `console.error` handlers with user-visible toasts
- Closed all frontend error handling gaps (open, reload, delete, save, file list)

### 2. Refactor EditorToolbar — DONE

- Split from 537 LOC to 278 LOC
- Extracted: `shared.tsx`, `useKeyboardShortcuts.ts`, `GitStatusBadge.tsx`, `SlideNavigation.tsx`, `SelectedElementIndicator.tsx`

### 3. E2E test coverage — DONE

- Added 12 new E2E tests (7 → 19 total)
- Covers: element editing, save workflow, slide navigation, undo/redo

### 4. Component unit tests — DONE

- Added 11 new unit tests for `dispatchSlideMessage`, `formatSize`, `formatDate`
- Extracted testable pure functions: `slide-message.ts`, `format.ts`

---

## Week 2: Features

### 5. Shareable deck URLs (1 day)

Enable opening a specific deck by URL so anyone on the same branch/repo can click a link to view it.

**Scope:**

- Add client-side routing: `http://localhost:5173/deck/filename` opens that deck directly
- URL updates as user navigates (select file, change slide)
- Optional slide anchor: `/deck/filename#slide-3`
- Add a **Share button** to the toolbar that copies the current URL to clipboard (with toast confirmation)
- Deep links work on page refresh (server returns the SPA for all `/deck/*` routes)

**Files affected:** `App.tsx` (routing), `EditorToolbar.tsx` (share button), Vite config (SPA fallback), Express server (catch-all for `/deck/*`).

**Future enhancement:** Cloud storage integration so links work without needing the repo.

### 6. Export dropdown menu (1 day)

Replace the single PDF export button with a dropdown button menu offering multiple export options.

**Scope:**

- **Dropdown button component** — click to expand sub-options, click outside to dismiss
- **Export current slide as PNG** — render the active slide iframe to canvas, download as PNG
- **Export full deck as PDF** — existing Cmd+P flow, triggered from the menu
- **Export as self-contained HTML** — inline any external asset references, download as single file

**Files affected:** New `ExportMenu.tsx` component, `EditorToolbar.tsx` (replace export button), new `export-png.ts` utility.

### 7. Editable Gantt charts (2-3 days)

Add a visual Gantt chart editor for timeline/project slides. This is a common slide type in our decks.

**Scope:**

- **Generic Gantt component** — rows with labels, start/end dates, horizontal bars on a timeline
- **Inline editing** — click row label to edit text, drag bar edges to change start/end dates, drag bar body to move
- **Add/remove rows** — buttons to insert new rows or delete existing ones
- **Brand colors** — bars pick up CSS custom properties from the deck's brand palette
- **Bridge integration** — Gantt chart detected as a special element type, edited via dedicated UI rather than raw contentEditable

**Skill update required:** The `/new-deck` skill needs a new slide type (or enhanced dashboard type) that generates Gantt chart markup in the expected structure.

**New files:** `src/components/editor/GanttEditor.tsx`, bridge detection for Gantt elements, skill template update.

### 8. Rich text editing toolbar (2 days)

Currently click-to-edit gives raw contentEditable with no formatting controls.

**Scope:**

- Floating toolbar appears on text selection within an editing element
- Actions: bold, italic, link (with URL prompt), heading level toggle
- Uses `document.execCommand` or Selection API within the iframe bridge
- Toolbar positioned above selection, dismisses on blur

**Bridge changes:** Add selection change listener, postMessage for toolbar state, receive formatting commands from parent.

**New components:** `FloatingToolbar.tsx` positioned via selection coordinates relayed from bridge.

### 9. Slide management operations (1 day)

Table-stakes operations missing from the slide overview panel.

**Scope:**

- **Add slide** — button in overview panel, inserts a new `<section class="slide">` (blank or from template chooser)
- **Delete slide** — right-click or button on thumbnail, with confirmation
- **Duplicate slide** — copy existing slide's HTML as new slide
- All operations integrate with undo/redo history

**Store changes:** Add `addSlide()`, `deleteSlide()`, `duplicateSlide()` actions to `editor-store.ts`.

**Serializer changes:** Ensure new slides get proper UUIDs and are serialized correctly.

---

## Priority Order (Week 2)

| Priority | Item                  | Est.     | Why                                                                 |
| -------- | --------------------- | -------- | ------------------------------------------------------------------- |
| 1        | Shareable deck URLs   | 1 day    | Enables collaboration — share a link, teammate opens the right deck |
| 2        | Export dropdown menu  | 1 day    | Unlocks PNG export, cleaner toolbar, quick win                      |
| 3        | Editable Gantt charts | 2-3 days | High-value for our use case — we create lots of Gantt charts        |
| 4        | Rich text toolbar     | 2 days   | Transforms "viewer with light editing" into "actual editor"         |
| 5        | Slide management      | 1 day    | Add/delete/duplicate slides is table-stakes                         |

Items 1-3 are the top priority. Items 4-5 fit if time allows.

---

## Future Features (deferred)

These are good ideas but not in the current sprint:

- **Keyboard navigation & accessibility** — arrow keys in overview, Tab through elements, aria labels, focus management
- **Image/asset handling** — click image to replace, drag-drop upload, server asset endpoints
- **Theme/style editing panel** — sidebar tab to edit CSS custom properties (colors, fonts) with live preview
- **Cloud storage for shared URLs** — so deck links work without needing the local repo
