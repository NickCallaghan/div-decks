# Core CSS

This CSS is REQUIRED in every deck. It handles the scroll-snap container, slide transitions, reveal animations, and navigation chrome. Copy it into your `<style>` block. Theme-specific CSS (colors, fonts, card styles) goes AFTER this.

## Deck Container & Slide Base

```css
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.deck {
  height: 100dvh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.slide {
  height: 100dvh;
  scroll-snap-align: start;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(40px, 6vh, 80px) clamp(40px, 8vw, 120px);
  isolation: isolate;
  opacity: 0;
  transform: translateY(40px) scale(0.98);
  transition:
    opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide.visible {
  opacity: 1;
  transform: none;
}
```

## Reveal Animation

```css
.slide .reveal {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide.visible .reveal {
  opacity: 1;
  transform: none;
}
.slide.visible .reveal:nth-child(1) {
  transition-delay: 0.1s;
}
.slide.visible .reveal:nth-child(2) {
  transition-delay: 0.2s;
}
.slide.visible .reveal:nth-child(3) {
  transition-delay: 0.3s;
}
.slide.visible .reveal:nth-child(4) {
  transition-delay: 0.4s;
}
.slide.visible .reveal:nth-child(5) {
  transition-delay: 0.5s;
}
.slide.visible .reveal:nth-child(6) {
  transition-delay: 0.6s;
}
.slide.visible .reveal:nth-child(7) {
  transition-delay: 0.7s;
}
.slide.visible .reveal:nth-child(8) {
  transition-delay: 0.8s;
}

@media (prefers-reduced-motion: reduce) {
  .slide,
  .slide .reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

## Typography Scale

```css
.slide__display {
  font-size: clamp(48px, 10vw, 120px);
  font-weight: 800;
  letter-spacing: -3px;
  line-height: 0.95;
  text-wrap: balance;
}

.slide__heading {
  font-size: clamp(28px, 5vw, 48px);
  font-weight: 700;
  letter-spacing: -1px;
  line-height: 1.1;
  text-wrap: balance;
}

.slide__body {
  font-size: clamp(16px, 2.2vw, 24px);
  line-height: 1.6;
  text-wrap: pretty;
}

.slide__label {
  font-family: var(--font-mono);
  font-size: clamp(10px, 1.2vw, 14px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
}
```

## Navigation Chrome

```css
.deck-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--accent);
  z-index: 100;
  transition: width 0.3s ease;
  pointer-events: none;
}

.deck-dots {
  position: fixed;
  right: clamp(12px, 2vw, 24px);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
  padding: 8px;
  background: color-mix(in srgb, var(--bg) 60%, transparent 40%);
  border-radius: 20px;
  backdrop-filter: blur(4px);
}

.deck-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-dim);
  opacity: 0.3;
  border: none;
  padding: 0;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.deck-dot:hover {
  opacity: 0.6;
}
.deck-dot.active {
  opacity: 1;
  transform: scale(1.5);
  background: var(--accent);
}

.deck-counter {
  position: fixed;
  bottom: clamp(12px, 2vh, 24px);
  right: clamp(12px, 2vw, 24px);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-dim);
  z-index: 100;
  font-variant-numeric: tabular-nums;
}

.deck-hints {
  position: fixed;
  bottom: clamp(12px, 2vh, 24px);
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-dim);
  opacity: 0.6;
  z-index: 100;
  transition: opacity 0.5s ease;
  white-space: nowrap;
}
.deck-hints.faded {
  opacity: 0;
  pointer-events: none;
}
```

## Slide Type Layouts

```css
/* Content — asymmetric grid */
.slide--content .slide__inner {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: clamp(24px, 4vw, 60px);
  align-items: center;
  width: 100%;
}

/* Split — two panels */
.slide--split .slide__panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  width: 100%;
  height: 100%;
}

/* Dashboard — auto-fit KPI grid */
.slide--dashboard .slide__kpis {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(clamp(140px, 20vw, 220px), 1fr)
  );
  gap: clamp(12px, 2vw, 24px);
}

/* Divider — centered with background number */
.slide--divider {
  justify-content: center;
  text-align: center;
}

.slide__number {
  position: absolute;
  font-size: clamp(200px, 30vw, 400px);
  font-weight: 900;
  opacity: 0.06;
  line-height: 1;
  pointer-events: none;
}

/* Bleed — full background */
.slide--bleed {
  padding: 0;
}
.slide__bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}
.slide__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3),
    rgba(0, 0, 0, 0.7)
  );
}
.slide--bleed .slide__content {
  position: relative;
  z-index: 1;
  padding: clamp(40px, 6vh, 80px) clamp(40px, 8vw, 120px);
}

/* Quote */
.slide--quote {
  text-align: center;
}
.slide__quote-mark {
  font-size: clamp(60px, 10vw, 120px);
  line-height: 1;
  opacity: 0.15;
}

/* Code */
.slide__code-block {
  font-family: var(--font-mono);
  font-size: clamp(14px, 1.5vw, 18px);
  line-height: 1.6;
  padding: clamp(16px, 3vw, 32px);
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  overflow-x: auto;
  white-space: pre;
  tab-size: 2;
}
.slide__code-filename {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 8px;
}

/* Bullets */
.slide__bullets {
  list-style: none;
  padding: 0;
}
.slide__bullets li {
  padding: 10px 0 10px 24px;
  position: relative;
  font-size: clamp(16px, 2vw, 22px);
  line-height: 1.5;
}
.slide__bullets li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 20px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

/* Table */
.table-wrap {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
.data-table th {
  font-family: var(--font-mono);
  font-size: clamp(10px, 1.3vw, 14px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-dim);
  text-align: left;
  padding: clamp(10px, 1.5vh, 16px) clamp(14px, 2vw, 24px);
  border-bottom: 2px solid var(--border);
}
.data-table td {
  padding: clamp(10px, 1.5vh, 16px) clamp(14px, 2vw, 24px);
  border-bottom: 1px solid var(--border);
  font-size: clamp(14px, 1.8vw, 20px);
}

/* KPIs */
.slide__kpi {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: clamp(16px, 3vh, 32px) clamp(16px, 2vw, 24px);
}
.slide__kpi-val {
  font-size: clamp(32px, 5vw, 64px);
  font-weight: 700;
  line-height: 1;
  color: var(--accent);
}
.slide__kpi-label {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-dim);
  margin-top: 8px;
}
.slide__kpi-trend {
  font-size: 13px;
  margin-top: 4px;
}
.slide__kpi-trend--up {
  color: var(--green, #059669);
}
.slide__kpi-trend--down {
  color: var(--red, #dc2626);
}
```

These CSS custom properties must be defined in your theme: `--bg`, `--surface`, `--text`, `--text-dim`, `--border`, `--accent`, `--font-body`, `--font-heading`, `--font-mono`. See the template for examples.
