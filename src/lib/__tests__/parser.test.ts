import { describe, it, expect } from 'vitest';
import { parsePresentation } from '../parser';

const MINIMAL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Test Deck</title>
<style>.slide { height: 100dvh; }</style>
</head>
<body>
<div class="deck">
  <!-- SLIDE 1: TITLE -->
  <section class="slide slide--title">
    <h1>Hello World</h1>
  </section>
  <!-- SLIDE 2: CONTENT -->
  <section class="slide slide--content">
    <h2>Content Slide</h2>
    <ul class="slide__bullets">
      <li>Bullet one</li>
      <li>Bullet two</li>
    </ul>
  </section>
  <!-- SLIDE 3: QUOTE -->
  <section class="slide slide--quote">
    <blockquote>A great quote</blockquote>
  </section>
</div>
<script>new SlideEngine();</script>
</body>
</html>`;

describe('parsePresentation', () => {
  it('extracts the title from the <title> tag', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    expect(model.title).toBe('Test Deck');
  });

  it('extracts the correct number of slides', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    expect(model.slides).toHaveLength(3);
  });

  it('detects slide types from CSS classes', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    expect(model.slides[0].type).toBe('title');
    expect(model.slides[1].type).toBe('content');
    expect(model.slides[2].type).toBe('quote');
  });

  it('assigns unique IDs to each slide', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    const ids = model.slides.map((s) => s.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('assigns sequential indexes', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    expect(model.slides.map((s) => s.index)).toEqual([0, 1, 2]);
  });

  it('preserves slide outerHtml', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    expect(model.slides[0].outerHtml).toContain('Hello World');
    expect(model.slides[0].outerHtml).toContain('slide--title');
    expect(model.slides[1].outerHtml).toContain('Bullet one');
  });

  it('preserves the head content', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    expect(model.head).toContain('<title>Test Deck</title>');
    expect(model.head).toContain('.slide { height: 100dvh; }');
  });

  it('preserves the script block', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    expect(model.scriptBlock).toContain('SlideEngine');
  });

  it('stores the filename', () => {
    const model = parsePresentation('my-deck.html', MINIMAL_HTML);
    expect(model.filename).toBe('my-deck.html');
  });

  it('falls back to filename for title if no <title> tag', () => {
    const noTitle = MINIMAL_HTML.replace('<title>Test Deck</title>', '');
    const model = parsePresentation('fallback.html', noTitle);
    expect(model.title).toBe('fallback');
  });

  it('handles unknown slide types gracefully', () => {
    const html = MINIMAL_HTML.replace('slide--title', 'slide--custom');
    const model = parsePresentation('test.html', html);
    expect(model.slides[0].type).toBe('unknown');
  });
});
