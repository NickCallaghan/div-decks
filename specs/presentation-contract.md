# Presentation Contract

What the div.deck editor auto-detects and what it expects from presentation HTML. This is reference documentation — no external tool or skill is required to read it. The editor works with arbitrary HTML; these guidelines describe what makes a presentation maximally editable.

## Structural Requirements

These are the only hard requirements. Without them, slides won't be parsed at all.

- **Slides**: `<section class="slide">` — the `.slide` class is how the parser finds slides
- **Slide type**: `slide--{type}` class (e.g., `slide--title`, `slide--content`, `slide--full`) — any string is accepted, not restricted to a fixed set
- **Deck wrapper**: `<div class="deck">` — expected by the scroll-snap engine and presentation mode

## What the Editor Auto-Detects

### Text editing (double-click to edit)

1. Standard HTML text elements: `h1`–`h6`, `p`, `li`, `span`, `a`, `blockquote`, `cite`, `figcaption`, `caption`, `label`, `dt`, `dd`, `td`, `th`, `pre`, `code`
2. **Leaf divs**: any `<div>` with no child elements and non-empty text content (catches inline-styled text labels like `<div style="font-size:22px;">Title</div>`)

### Reordering (drag handles)

1. Standard block elements: headings, paragraphs, lists, blockquotes, etc.
2. Direct children of `section.slide`
3. **Repeating groups** (sibling-homogeneity heuristic): elements that share the same HTML tag AND at least one CSS class with a sibling are detected as a repeating component group. For example, three `<div class="step">` siblings automatically get drag handles.

### Atomic containers (drag as a unit)

1. Any element with a class ending in `card` (e.g., `skill-card`, `stat-card`, `ve-card`)
2. Legacy component classes: `slide__kpi`, `slide__panel`, `status`, `tag`

### Excluded from editing

- Elements inside `<svg>` or `<script>` tags
- `.mermaid-wrap` containers
- `.slide__decor` elements

## Data-Attribute Overrides

For edge cases where auto-detection isn't enough, presentations can use these attributes:

| Attribute                  | Effect                                                          |
| -------------------------- | --------------------------------------------------------------- |
| `data-se-reorderable`      | Element is explicitly reorderable (must have siblings)          |
| `data-se-atomic`           | Element drags as a unit — children don't get individual handles |
| `data-se-editable="false"` | Element is excluded from text editing                           |

These are opt-in. Nothing depends on them being present.

## Tips for Maximum Editability

- **Use semantic HTML** for text content (headings, paragraphs, lists). These are always editable and reorderable.
- **Use named classes for repeating components** rather than anonymous inline-styled divs. The sibling-homogeneity heuristic needs at least one shared class to detect a group.
- **End card-like component classes with `-card`** to trigger automatic atomic container detection.
- **Avoid excessive inline styles on structural elements.** Named classes make components more detectable and maintainable.
