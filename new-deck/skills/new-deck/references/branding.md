# Branding integration

A deck has two CSS layers:

1. **Core CSS** (`assets/core.css`) — structural, functional, never modified by branding.
2. **Theme CSS** (`themes/<name>.css`) — colours, fonts, decoration. This is what branding customises.

Brand skills integrate by **shipping a theme file**, not by editing or layering on top of core CSS.

## How a brand skill plugs in

A brand skill (e.g. `hyble-brand`) writes a theme file to the same `themes/` directory and the user invokes the builder with `--theme <brand-name>`. The brand theme is structurally identical to the four built-in themes: a single `.css` file containing optional `@import` for fonts, plus a `:root { ... }` block defining the variable contract.

Required variables (all must be set):

```
--bg --surface --text --text-dim --border
--accent --accent-dim
--green --red
--font-body --font-heading --font-mono
```

Optional additions inside the same file:

- Component-level overrides scoped to slide types (e.g. `.slide--quote { background: ... }`).
- Decorative `body` background (gradients, patterns, textures).
- Font loading via `@import` at the top of the file.

## Hard boundaries

A brand theme **must not** include rules for:

- `.deck` container (scroll-snap, height, overflow).
- `.slide` base layout (height, snap-align, flex, the entrance transition).
- `.reveal` animation timing or delay sequencing.
- Navigation chrome positioning (`.deck-progress`, `.deck-dots`, `.deck-counter`, `.deck-hints`).
- Slide-type structural grids (`.slide--content .slide__inner`, `.slide--split .slide__panels`, `.slide--dashboard .slide__kpis`).
- Anything in `assets/slide-engine.js` — never touch.

If a brand skill needs to violate one of these, that's a bug in the core CSS, not the brand. File it.

## Example

A brand theme file `themes/hyble.css`:

```css
@import url("https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&display=swap");

:root {
  --bg: #0a1628;
  --surface: #132040;
  --text: #ffffff;
  --text-dim: #9aa3b8;
  --border: #1f2d4d;
  --accent: #00ffd2;
  --accent-dim: rgba(0, 255, 210, 0.08);
  --green: #34d399;
  --red: #f87171;
  --font-body: "Barlow", system-ui, sans-serif;
  --font-heading: "Barlow", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

Invoked as `--theme hyble`. Same builder, no special path.
