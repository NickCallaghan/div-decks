# Branding Integration

Decks have two CSS layers:

1. **Core CSS** (from css-core.md) — structural, functional, NEVER modified by branding
2. **Theme CSS** — colors, fonts, backgrounds, decorative elements — this is what branding customizes

## What brand skills CAN customize

- CSS custom properties: `--bg`, `--surface`, `--text`, `--text-dim`, `--border`, `--accent`, `--font-body`, `--font-heading`, `--font-mono`, plus any custom brand variables
- Card/component styles (`.ve-card` variants, custom components)
- Background treatments (gradients, patterns, images)
- Font loading (`@import` or `<link>` for Google Fonts)
- Color palette and theming
- Decorative elements (accent lines, SVGs, glow effects)
- Dark/light mode overrides via `@media (prefers-color-scheme)`

## What brand skills must NOT modify

- `.deck` container rules (scroll-snap, height, overflow)
- `.slide` base rules (height, snap-align, flex, opacity/transform transition)
- `.reveal` animation timing and delays
- Navigation chrome positioning (`.deck-progress`, `.deck-dots`, `.deck-counter`, `.deck-hints`)
- SlideEngine JavaScript (never modify)
- Slide type structural layouts (`.slide--content .slide__inner` grid, `.slide--split .slide__panels` grid, etc.)

## Pattern

Brand CSS goes in a separate `<style>` block AFTER the core CSS. It overrides CSS custom properties and adds brand-specific component styles.

```html
<style>
  /* Core CSS from css-core.md goes here */
</style>

<style>
  /* Brand CSS — overrides theme variables, adds brand components */
  :root {
    --bg: #0a1628;
    --surface: #132040;
    --text: #ffffff;
    --accent: #00ffd2;
    --font-heading: "Barlow Semi Condensed", sans-serif;
    --font-body: "Barlow", sans-serif;
    --font-mono: "JetBrains Mono", monospace;
  }
  /* Brand-specific component styles */
</style>
```
