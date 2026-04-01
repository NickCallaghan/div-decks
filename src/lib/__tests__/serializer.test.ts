import { describe, it, expect } from 'vitest';
import { serializePresentation } from '../serializer';
import { parsePresentation } from '../parser';
import type { PresentationModel } from '../../types/presentation';

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
  </section>
</div>
<script>new SlideEngine();</script>
</body>
</html>`;

describe('serializePresentation', () => {
  it('produces valid HTML with DOCTYPE', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    const html = serializePresentation(model);
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('</html>');
  });

  it('preserves the head content', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    const html = serializePresentation(model);
    expect(html).toContain('<title>Test Deck</title>');
    expect(html).toContain('.slide { height: 100dvh; }');
  });

  it('preserves all slides', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    const html = serializePresentation(model);
    expect(html).toContain('Hello World');
    expect(html).toContain('Content Slide');
  });

  it('preserves the script block', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    const html = serializePresentation(model);
    expect(html).toContain('SlideEngine');
  });

  it('wraps slides in a deck container', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    const html = serializePresentation(model);
    expect(html).toContain('<div class="deck">');
    expect(html).toContain('</div><!-- /deck -->');
  });

  it('respects slide order', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    // Reverse the slides
    model.slides = [...model.slides].reverse();
    const html = serializePresentation(model);
    const titlePos = html.indexOf('Hello World');
    const contentPos = html.indexOf('Content Slide');
    // Content should come before Title after reversal
    expect(contentPos).toBeLessThan(titlePos);
  });

  it('includes slide comments when present', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    // Manually set a comment
    model.slides[0].comment = '<!-- My Comment -->';
    const html = serializePresentation(model);
    expect(html).toContain('<!-- My Comment -->');
  });
});

describe('round-trip: parse then serialize', () => {
  it('preserves slide content through parse/serialize cycle', () => {
    const model = parsePresentation('test.html', MINIMAL_HTML);
    const html = serializePresentation(model);
    const model2 = parsePresentation('test.html', html);

    expect(model2.slides).toHaveLength(model.slides.length);
    expect(model2.title).toBe(model.title);

    for (let i = 0; i < model.slides.length; i++) {
      expect(model2.slides[i].type).toBe(model.slides[i].type);
      expect(model2.slides[i].outerHtml).toContain(
        model.slides[i].type === 'title' ? 'Hello World' : 'Content Slide'
      );
    }
  });

  it('preserves slide count after multiple round-trips', () => {
    let html = MINIMAL_HTML;
    for (let i = 0; i < 3; i++) {
      const model = parsePresentation('test.html', html);
      html = serializePresentation(model);
    }
    const finalModel = parsePresentation('test.html', html);
    expect(finalModel.slides).toHaveLength(2);
  });
});
