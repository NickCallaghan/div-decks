---
name: new-deck
description: Generate self-contained HTML slide decks compatible with div.deck. Use when the user asks to create a slide deck, presentation, or invokes /new-deck.
license: MIT
metadata:
  author: Nick Callaghan
  version: "0.1.0"
---

Generate a self-contained HTML slide deck. Each deck is a single HTML file with embedded CSS and JavaScript that works standalone in any browser AND can be edited in div.deck.

## When to use

Use this skill when `/new-deck` is explicitly invoked, or when the user asks to create a slide deck or presentation.

Note: `visual-explainer` may also be installed and can generate slides. If both skills are installed and the user asks generically for "slides" without invoking a command, present the choice:

- `/new-deck` — div.deck-optimized deck, editable in the editor, uses the SlideEngine
- `/generate-slides` — visual-explainer's broader output, magazine-quality standalone page

`/new-deck` always uses this skill. Never redirect a `/new-deck` invocation to visual-explainer.

## Workflow

### Step 1 — Think (take 5 seconds)

Pick an aesthetic direction from the four presets below. Vary from any previous deck you've made in this session. Consider the audience and content type: technical content suits Terminal Mono or Swiss Clean; strategic/executive content suits Midnight Editorial or Warm Signal.

### Step 2 — Structure

Plan the full slide sequence before writing any HTML:

1. Inventory every content item in the source material
2. Map each item to a slide — do not omit anything
3. Choose a layout type for each slide from `./references/slide-types.md`
4. Verify compositional variety: no three consecutive slides with the same spatial layout

Content density limits per slide:

- Bullets: max 6
- Code lines: max 10
- Table rows: max 8
- Pull quotes: max 150 characters

Scale slide count to content. A source doc with 7 sections typically needs 18–25 slides, not 10–13. Err toward more slides with less per slide.

### Step 3 — Generate

Write the complete HTML file. Follow these sources:

- Read `./templates/slide-deck.html` for the reference template
- Read `./references/slide-engine.md` for the SlideEngine JS to embed
- Read `./references/css-core.md` for the required base CSS

Follow the HTML contract strictly (see below). Do not approximate — copy the exact structure.

### Step 4 — Deliver

Find the project's `presentations/` directory (look for it relative to the current working directory, or ask the user if not found). Save the deck there with a descriptive kebab-case filename, e.g. `q2-roadmap-review.html`. After saving, open it in the browser.

## HTML contract

Every deck must follow this structure exactly:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Deck Title</title>
    <style>
      /* CSS core + aesthetic theme inline here */
    </style>
  </head>
  <body>
    <div class="deck">
      <section class="slide slide--{type}">
        <div class="reveal">...</div>
        <!-- more .reveal children for animation sequencing -->
      </section>
      <!-- more slides -->
    </div>
    <script>
      // SlideEngine JS inline here
    </script>
  </body>
</html>
```

Rules:

- All CSS in a single `<style>` block in `<head>`. No external stylesheets.
- All JS in a single `<script>` block before `</body>`. No external scripts.
- Each slide is `<section class="slide slide--{type}">`. The type must match a type from `./references/slide-types.md`.
- Each animated element is wrapped in `<div class="reveal">`. Multiple `.reveal` children animate in sequence.
- The file must be fully self-contained — no network requests, no CDN fonts unless you inline the @font-face.

## Branding boundary

Theming (colors, fonts, backgrounds) is separate from structure. The boundary is strict:

**Brand skills MAY override:**

- CSS custom properties (e.g. `--color-bg`, `--color-accent`, `--font-display`)
- Visual decorations: backgrounds, gradients, textures, borders

**Brand skills MUST NOT touch:**

- `.deck` and `.slide` base layout rules
- `.reveal` animation keyframes and timing
- Navigation chrome (slide counter, keyboard handling)
- SlideEngine JS — never modify it

If a branding skill is active (e.g. `hyble-brand`), apply it after generating the structural HTML. See `./references/branding.md` for the full override contract.

## Aesthetic presets

Choose one per deck. Rotate to avoid sameness.

**Midnight Editorial**
Deep navy background (`#0d1117` range), serif display typeface (Instrument Serif or Crimson Pro), gold/amber accents, wide margins, cinematic proportions. Feels authoritative and editorial. Good for strategy, leadership, vision decks.

**Warm Signal**
Cream paper background (`#faf7f5`), bold geometric sans (DM Sans, Plus Jakarta Sans), terracotta and sage accents, confident generous spacing. Feels modern and human. Good for product, culture, team decks.

**Terminal Mono**
Dark background with subtle dot/grid texture, monospace everything (JetBrains Mono, Fira Code), green or amber accent on black. Feels technical and precise. Good for engineering, architecture, ops decks.

**Swiss Clean**
Pure white background, geometric sans (Inter is acceptable here only), single blue accent color, tight grid, generous whitespace, no decoration. Feels minimal and rigorous. Good for data, finance, research decks.

## Anti-patterns

These are forbidden. If you catch yourself doing any of these, stop and redo:

- **Neon gradient trio**: cyan + magenta + purple as primary palette — it screams default AI output
- **Emoji section headers**: no emoji in `<h2>` or slide titles
- **Inter + violet/indigo**: the default AI color scheme — use a different font or a different accent
- **Uniform card depth**: if a slide has multiple cards, vary their treatment — some elevated (shadow), some recessed (inset), some hero (full bleed), some glass (backdrop blur)
- **Layout repetition**: three consecutive slides with the same spatial composition (e.g. centered title + bullets three times in a row)

## Compositional variety

Rotate through these spatial compositions across slides. Consecutive slides must differ:

- **Centered**: title and content centered horizontally, strong vertical rhythm
- **Left-heavy**: headline and primary content on left, supporting detail or visual on right
- **Right-heavy**: reversed — visual or stat on left, narrative on right
- **Split**: two equal columns with deliberate tension between them
- **Full-bleed**: content fills the slide, no visible margins, background is the design

A deck of 20 slides should use all five compositions multiple times in varied order.
