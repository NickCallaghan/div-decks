# Two-Week Improvement Plan

**Created:** 2026-04-06
**Target version:** v0.5.0
**Starting from:** v0.3.4

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

## Week 1: Foundation & Quality

### 1. Toast/notification system (1 day)

Replace silent `console.error` catches with user-visible feedback.

**Scope:**

- Add a lightweight toast/notification component (no external dependency needed)
- Surface: save success, save failure, delete confirmation, git status errors
- Auto-dismiss after ~3s, stack multiple notifications

**Files affected:** New toast component, `usePresentation.ts`, `FileBrowser.tsx`, `useGitStatus.ts`

### 2. Refactor EditorToolbar (1 day)

Split the 537 LOC monolith into focused pieces.

**Target structure:**

- `useKeyboardShortcuts` hook — all Cmd+key bindings extracted
- `GitStatusBadge` component — branch name + file status indicator
- `NavigationControls` component — slide prev/next, slide counter
- `FormattingToolbar` component — undo/redo, save button, future formatting actions

**Constraint:** No behavior changes — pure refactor with existing tests still passing.

### 3. E2E test coverage for core workflows (2 days)

Implement the Playwright verification plan already outlined in specs. Target scenarios:

- [ ] Select element → edit text → save → verify file changed on disk
- [ ] Drag handle → reorder elements → verify DOM update
- [ ] Context menu → delete element → verify removal
- [ ] Context menu → duplicate element → verify new element
- [ ] Slide reorder via sidebar drag-and-drop
- [ ] Undo/redo round-trip (edit → undo → verify restored)
- [ ] Presentation mode: enter, navigate forward/back, exit
- [ ] Save dirty indicator: edit → dirty flag → save → clean flag
- [ ] Keyboard shortcuts: Cmd+S (save), Cmd+Z (undo), Cmd+Shift+Z (redo)

### 4. Component unit tests (1 day)

Add tests for the untested interaction-heavy components:

- **FileBrowser** — delete confirmation flow, file selection callback
- **SlideOverview** — drag callbacks, active slide highlighting
- **SlideRenderer** — postMessage handling, iframe setup
- **PresentationMode** — keyboard navigation, exit behavior

---

## Week 2: Features & Polish

### 5. Rich text editing toolbar (2 days)

The most impactful missing feature. Currently click-to-edit gives a raw contentEditable with no formatting controls.

**Scope:**

- Floating toolbar appears on text selection within an editing element
- Actions: bold, italic, link (with URL prompt), heading level toggle
- Uses `document.execCommand` or Selection API within the iframe bridge
- Toolbar positioned above selection, dismisses on blur

**Bridge changes:** Add selection change listener, postMessage for toolbar state, receive formatting commands from parent.

**New components:** `FloatingToolbar.tsx` positioned via selection coordinates relayed from bridge.

### 6. Slide management operations (1 day)

Table-stakes operations missing from the slide overview panel.

**Scope:**

- **Add slide** — button in overview panel, inserts a new `<section class="slide">` (blank or from template chooser)
- **Delete slide** — right-click or button on thumbnail, with confirmation
- **Duplicate slide** — copy existing slide's HTML as new slide
- All operations integrate with undo/redo history

**Store changes:** Add `addSlide()`, `deleteSlide()`, `duplicateSlide()` actions to `editor-store.ts`.

**Serializer changes:** Ensure new slides get proper UUIDs and are serialized correctly.

### 7. Keyboard navigation & accessibility (1 day)

**Scope:**

- Arrow keys navigate slides in the overview panel
- Tab/Shift+Tab cycles through elements on the active slide
- Aria labels on all interactive elements (toolbar buttons, slide thumbnails, file list items)
- Focus management when switching slides (focus moves to canvas)
- Screen reader announcements for state changes (slide selected, element edited)

**Files affected:** `SlideOverview.tsx`, `SortableSlide.tsx`, `EditorToolbar.tsx` (sub-components), `bridge.ts` (Tab key handling).

### 8. Image/asset handling (1 day)

**Scope:**

- Click an image element in the slide → show replace button
- File picker → upload to server → update `src` attribute
- Drag-drop image onto slide canvas
- New server endpoint: `POST /api/assets/` (stores in `presentations/assets/`)
- New server endpoint: `GET /api/assets/:filename`

**Bridge changes:** Add image click detection, postMessage for image replacement.

### 9. Theme/style editing panel (1-2 days)

Most generated decks use CSS custom properties for colors, fonts, and spacing. Expose them as editable controls.

**Scope:**

- New sidebar panel (tab alongside Files and Slides)
- Parse `<style>` block for CSS custom property declarations (`--color-*`, `--font-*`, etc.)
- Render color pickers, font selectors, spacing sliders
- Live preview: update iframe's CSS variables in real-time
- On save: write modified custom properties back into the `<style>` block

**Parser changes:** Extract CSS custom properties from style blocks into the presentation model.

### 10. Export improvements (0.5 day)

**Scope:**

- Export as self-contained HTML (inline any external asset references)
- Export individual slides as PNG (using canvas/html2canvas in the iframe)
- Improve existing PDF export with page size options

---

## Priority Order (if time gets tight)

Cut from the bottom. The top items deliver the most value:

| Priority | Item                | Why                                                         |
| -------- | ------------------- | ----------------------------------------------------------- |
| 1        | Toast system        | Prevents silent failures, quick win                         |
| 2        | Toolbar refactor    | Unlocks future feature work without growing the monolith    |
| 3        | E2E tests           | Catches regressions in the bridge (riskiest code)           |
| 4        | Component tests     | Cheap insurance                                             |
| 5        | Rich text toolbar   | Transforms "viewer with light editing" into "actual editor" |
| 6        | Slide management    | Add/delete/duplicate slides is table-stakes                 |
| 7        | Keyboard nav & a11y | Important but deferrable                                    |
| 8        | Image handling      | Important but deferrable                                    |
| 9        | Theme panel         | Nice-to-have                                                |
| 10       | Export improvements | Nice-to-have                                                |

Items 1-6 are the v0.5.0 must-haves. Items 7-10 can slip to v0.6.0.
