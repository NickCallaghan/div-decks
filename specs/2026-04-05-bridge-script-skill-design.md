# Bridge Script Development Skill — Design Spec

## Context

The bridge script (`src/lib/bridge.ts`) is the most complex file in div.deck. It implements the full in-slide interaction model — hover handles, click-to-select, click-to-edit, drag-to-reorder, and context menus — all running inside iframe sandboxes as vanilla JS with no imports.

Changes to this file are high-risk because:

- It implements a state machine (IDLE → HANDLE_VISIBLE → SELECTED → EDITING) that must not have transitions skipped or broken
- It maintains two selector lists (TEXT_SELECTOR, REORDERABLE_SELECTOR) that must stay consistent
- It has a DOM cleanup step that must strip all editor artifacts before saving
- Unit tests can't fully exercise it since it runs inside iframes — browser verification is essential
- Several non-obvious design patterns (zone-first hover, sibling walk-up, explicit selectors) exist for good reasons and are easy to accidentally break

This skill provides guardrails and workflow guidance for any changes touching the bridge or its interaction surface.

## Skill Type

**Rigid.** The invariant checklist and browser verification are non-negotiable. The feature workflow steps must be followed in order.

## Trigger Conditions

The skill activates when:

1. Directly editing `src/lib/bridge.ts`
2. Adding new HTML element types to presentations that may need selector updates
3. Modifying components that send/receive postMessages to/from the bridge (SlideRenderer.tsx, EditorCanvas.tsx)

## Modes

### Guard Mode

Triggered when modifying existing bridge behavior. Steps:

1. Read current `bridge.ts` and identify what's changing
2. Run the invariant checklist (all 9 items)
3. Require browser verification of the specific affected behavior
4. Verify DOM cleanup still strips all editor artifacts after the change

### Feature Mode

Triggered when adding new interactive capabilities or element types. Steps:

1. Identify which selectors need updating (TEXT_SELECTOR, REORDERABLE_SELECTOR, atomic container regex)
2. Check selector consistency — if it's in TEXT_SELECTOR, does it need REORDERABLE_SELECTOR too? And vice versa.
3. Determine drag behavior — will this element appear in grid or list layouts? Grid uses swap, list uses insert-before.
4. Implement the change
5. Run the full invariant checklist
6. Require browser verification: hover, select, edit, drag, and save round-trip

## Invariant Checklist

These are non-negotiable checks before any bridge change is complete:

1. **State machine integrity** — Transitions follow IDLE → HANDLE_VISIBLE → SELECTED → EDITING. No skipped states. `clearSelection()` is called before selecting a new element.
2. **Selector consistency** — TEXT_SELECTOR and REORDERABLE_SELECTOR are aligned. New editable elements appear in both where appropriate.
3. **Atomic container rules** — Elements matching the atomic regex (`*card`, `slide__kpi`, `slide__panel`, `status`, `tag`) don't expose children as independent targets.
4. **Handle zone-first logic** — In the mousemove handler, the handle zone check runs BEFORE target lookup. This order must not be reversed — otherwise the target switches to whatever's in the gap between elements and the handle vanishes.
5. **Sibling walk-up** — `findHandleTarget` walks up through ancestors when the innermost match has no siblings (nothing to reorder with).
6. **No wildcard selectors** — REORDERABLE_SELECTOR uses explicit patterns, never deep wildcards like `section.slide > * > * > *`. Wildcards cause cascading conflicts where internal parts of components become reorderable.
7. **DOM cleanup** — `notifyDomChange()` clones the section and strips `.se-dragging` class, `data-se-selected` attribute, inline styles, and `contenteditable` attribute before sending `dom-updated` to parent.
8. **PostMessage protocol** — Message types (`bridge-ready`, `element-clicked`, `element-deselected`, `editing-started`, `editing-finished`, `dom-updated`) and envelope format (`{ type, ...data }`) are unchanged unless parent listeners are updated simultaneously.
9. **Timing constants** — Drag threshold (5px), edit delay (400ms), handle hide debounce (80ms) are preserved unless explicitly redesigned with justification.

## Verification Requirement

Every bridge change MUST be verified in the browser before claiming done:

1. Ensure dev server is running (`npm run dev`)
2. Navigate to `http://localhost:5173` with Playwright MCP (`browser_navigate`)
3. Open a presentation with diverse element types
4. Test the specific behavior changed:
   - **Hover**: Handle appears on element hover, follows zone-first logic, hides when mouse exits zone
   - **Select**: Click selects element (blue outline), click again enters edit mode (green outline)
   - **Drag**: Handle drag reorders correctly — swap for grid layouts, insert-before for list layouts
   - **Edit**: contenteditable activates, text changes persist
   - **Save**: After editing, the saved HTML contains no editor artifacts (no outlines, no contenteditable, no data attributes)
5. Run `npm test` (unit) and `npm run test:e2e` (E2E) — both must pass

## Skill Location

`~/.claude/skills/bridge-script.md` — a single-file skill with no reference files needed. All invariant knowledge is embedded directly.

## Output

A single `SKILL.md`-format file at `~/.claude/skills/bridge-script.md` with:

- Frontmatter (name, description)
- Trigger conditions
- Guard mode workflow
- Feature mode workflow
- Invariant checklist (the core of the skill)
- Verification protocol
