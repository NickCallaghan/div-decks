# div.deck — Interaction Model

## State Machine

The editor bridge script (injected into each slide iframe) manages these states:

```
IDLE → hover reorderable element → HANDLE_VISIBLE
HANDLE_VISIBLE → mouse leaves zone → IDLE
HANDLE_VISIBLE → click element → SELECTED
HANDLE_VISIBLE → click handle → MENU_OPEN
HANDLE_VISIBLE → drag handle → DRAGGING
MENU_OPEN → click action → SELECTED
MENU_OPEN → click outside / Esc → SELECTED
DRAGGING → drop on target → SELECTED
SELECTED → click same text (after 400ms) → EDITING
EDITING → blur / click outside / Esc → SELECTED
```

## States

### IDLE
- No selection, handle hidden, menu hidden
- Hover outlines appear on interactive elements

### HANDLE_VISIBLE
- Notion-style grip icon (6 dots) appears to the left of a reorderable element
- Positioned at `element.left - 30px`, vertically centered
- If element is near the left edge, handle overlaps the element at `element.left + 4px`
- Debounced hide (80ms) when mouse leaves the element + handle zone
- Zone extends 36px left of element and 4px above/below

### SELECTED
- Blue outline (`2px solid #3b82f6`) around selected element
- `data-se-selected="true"` attribute set
- Toolbar shows element tag name
- `selectedAt` timestamp recorded for edit delay

### MENU_OPEN
- Context menu appears below the drag handle
- Items: Move Up, Move Down, separator, Duplicate, Delete (red)
- Move Up/Down disabled at boundaries (no previous/next sibling)
- Menu clamped to viewport edges
- Closes on click outside, Escape, or action

### DRAGGING
- Started by mousedown on handle + mousemove > 5px threshold
- Dragged element gets `.se-dragging` class (opacity 0.4, dashed blue outline, pointer-events: none)
- Handle hidden during drag
- Drop indicator shown on hover over siblings:
  - **List layout**: horizontal blue line above target (insert before)
  - **Grid layout**: dashed blue outline around target card (swap)
- On drop: list → `target.before(dragEl)`, grid → `swapElements(dragEl, target)`

### EDITING
- Green outline (`2px solid #22c55e`) replaces blue
- `contentEditable="true"` set on the element
- Cursor placed at the click position using `caretRangeFromPoint`
- Handle and menu hidden
- On blur or Escape: exits edit mode, reverts to blue outline, sends `dom-updated`

## Element Categories

### Text-editable elements (TEXT_SELECTOR)
```
h1, h2, h3, h4, p, li, span, blockquote, cite, td, th,
div.turtle-card__desc, div.turtle-card__name,
div.slide__kpi-val, div.slide__kpi-label
```

### Reorderable elements (REORDERABLE_SELECTOR)
Elements that get drag handles. Must be direct children of a container and have at least one sibling.
```
ul.slide__bullets > li           — bullet points
ol > li                          — numbered list items
div.turtle-grid > div.turtle-card — cards in a grid
div.slide__kpis > div.slide__kpi  — KPI stat cards
tbody > tr                       — table rows
div.slide__panels > div.slide__panel — split slide panels
```

## Drag Behavior

### List layout (single column)
- Detected when parent is NOT `display: grid`
- Insert before: dragged element moves to the target's position, everything below shifts down
- Visual: horizontal blue line above the target

### Grid layout (multi-column)
- Detected when parent has `display: grid` or `inline-grid`
- Swap: dragged element and target exchange positions, everything else stays
- Visual: dashed blue outline around the target card

## PostMessage Protocol

### Bridge → Parent
| Message | When | Data |
|---------|------|------|
| `bridge-ready` | Script initialized | — |
| `element-clicked` | Element selected | selector, tagName, className, text, rect |
| `element-deselected` | Selection cleared | — |
| `editing-started` | Entered edit mode | — |
| `editing-finished` | Exited edit mode | — |
| `dom-updated` | DOM changed (edit, delete, reorder) | outerHtml (cleaned) |

### Parent → Bridge
| Message | When | Data |
|---------|------|------|
| `delete-selected` | Delete button / key | — |
| `move-element` | Move up/down | direction: 'up' \| 'down' |
| `deselect` | Escape / deselect button | — |

## DOM Cleanup (notifyDomChange)

Before sending `dom-updated`, the bridge clones the section and strips:
- `.se-dragging` class
- `data-se-selected` attribute
- `style.outline` and `style.outlineOffset`
- `contenteditable` attribute

This ensures saved HTML contains no editor artifacts.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+S | Save presentation |
| Cmd+Z | Undo |
| Cmd+Shift+Z / Cmd+Y | Redo |
| Cmd+I | Toggle shortcut hints |
| Left/Right arrows | Navigate slides |
| Escape | Deselect / exit edit mode / exit presentation |
| Delete/Backspace | Delete selected element |

## Presentation Mode

- Activated by Play button in toolbar
- Deselects all elements before entering
- Serializes current presentation state into full HTML
- Renders in full-screen iframe with original SlideEngine (no editor overrides)
- Starts at the currently active slide (instant scroll, then smooth for navigation)
- Escape exits via postMessage from iframe to parent
- Parent keyboard handlers suppressed during presentation
