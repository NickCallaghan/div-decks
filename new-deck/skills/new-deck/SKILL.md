---
name: new-deck
description: Generate self-contained HTML slide decks compatible with div.deck. Use when the user asks to create a slide deck, presentation, or invokes /new-deck.
license: MIT
metadata:
  author: Nick Callaghan
  version: "0.2.0"
---

Generate a self-contained HTML slide deck. Each deck is a single HTML file produced by a deterministic builder: you write only the slide sections and a theme name; the builder injects the engine, core CSS, and theme.

## When to use

Use this skill when `/new-deck` is explicitly invoked, or when the user asks to create a slide deck or presentation.

Note: `visual-explainer` may also be installed and can generate slides. If both skills are installed and the user asks generically for "slides" without invoking a command, present the choice:

- `/new-deck` — div.deck-optimized deck, editable in the editor, uses the SlideEngine
- `/generate-slides` — visual-explainer's broader output, magazine-quality standalone page

`/new-deck` always uses this skill. Never redirect a `/new-deck` invocation to visual-explainer.

## Workflow

### Step 1 — Think (take 5 seconds)

Pick a theme from the four below. Vary from any previous deck you've made in this session. Technical content suits `terminal` or `swiss`; strategic/executive content suits `midnight` or `warm-signal`.

### Step 2 — Structure

Plan the full slide sequence before writing any HTML:

1. Inventory every content item in the source material.
2. Map each item to a slide — do not omit anything.
3. Choose a layout type for each slide from `./references/slide-types.md`.
4. Verify compositional variety: no three consecutive slides with the same spatial layout.

Content density limits per slide:

- Bullets: max 6
- Code lines: max 10
- Table rows: max 8
- Pull quotes: max 150 characters

Scale slide count to content. A source doc with 7 sections typically needs 18–25 slides.

### Step 3 — Generate

Write the slide sections only — no `<html>`, no `<head>`, no `<style>`, no `<script>`. Each slide is a `<section class="slide slide--{type}">…</section>` following the structures in `./references/slide-types.md`. Save the fragment to a temp file.

Then invoke the builder:

```
node <skill-dir>/bin/build-deck.mjs \
  --theme <midnight | warm-signal | terminal | swiss> \
  --slides <path-to-fragment> \
  --title "<deck title>" \
  --out <project>/presentations/<kebab-slug>.html
```

The builder fails fast on invalid input. Read its stderr if it exits non-zero — do not retry with a workaround.

Do not write CSS or JavaScript yourself. Theme tokens (`--bg`, `--accent`, `--font-*`) come from the chosen theme file. If a slide needs a one-off flourish, scope a small `<style>` inside that section. Never modify or shadow the engine or core CSS.

### Step 4 — Deliver

The builder prints the absolute output path on stdout. Open that file in the browser.

## HTML contract (slide fragments)

The fragment you write is a sequence of slide sections. Each:

- Is `<section class="slide slide--{type}">` where `{type}` is one of `title`, `divider`, `content`, `split`, `dashboard`, `table`, `code`, `quote`, `bleed`.
- Contains one or more `<div class="reveal">` children for staggered entrance animation, OR places `class="reveal"` directly on the animated element.
- Uses the structures shown in `./references/slide-types.md`. Do not invent new top-level slide types.

The builder produces the `<head>`, the `<style>` block (theme + core), the `<div class="deck">` wrapper, and the `<script>` block — you must not.

## Themes

Pick one per deck. Rotate to avoid sameness across a session.

- **`midnight`** — deep navy, italic Crimson Pro serif, amber accent. Authoritative and editorial. Strategy, leadership, vision.
- **`warm-signal`** — cream paper, Plus Jakarta Sans, terracotta accent. Modern and human. Product, culture, team.
- **`terminal`** — near-black with subtle dot grid, JetBrains Mono throughout, terminal-green accent. Technical and precise. Engineering, architecture, ops.
- **`swiss`** — pure white, DM Sans, single blue accent, generous whitespace. Minimal and rigorous. Data, finance, research.

If a branding skill is active (e.g. `hyble-brand`), it supplies its own theme file via the same `--theme` argument. See `./references/branding.md`.

## Anti-patterns

Forbidden. If you catch yourself doing any of these, stop and redo:

- **Hand-writing the engine, core CSS, or `<head>`.** The builder owns these. Fragment-only output.
- **Neon gradient trio** (cyan + magenta + purple) as primary palette — screams default AI output.
- **Emoji in slide titles** (`<h2>`, `slide__display`, `slide__heading`).
- **Inter + violet/indigo** — the default AI scheme; pick a different theme.
- **Uniform card depth.** If a slide has multiple cards, vary their treatment — some elevated, some recessed, some hero, some glass.
- **Layout repetition** — three consecutive slides with the same spatial composition.

## Compositional variety

Rotate through these spatial compositions. Consecutive slides must differ:

- **Centered** — title and content centered horizontally, strong vertical rhythm.
- **Left-heavy** — headline and primary content on left, supporting detail or visual on right.
- **Right-heavy** — visual or stat on left, narrative on right.
- **Split** — two equal columns with deliberate tension.
- **Full-bleed** — content fills the slide, no visible margins, background is the design.

A 20-slide deck should use all five compositions multiple times in varied order.
