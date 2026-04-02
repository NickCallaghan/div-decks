import { describe, it, expect, beforeEach } from "vitest";

/**
 * Tests for bridge selector logic. The bridge runs as a string template
 * inside iframes, so we can't import it directly. Instead we replicate
 * the selectors and test the matching logic against real DOM structures
 * that mirror what visual-explainer generates.
 *
 * If you change TEXT_SELECTOR or REORDERABLE_SELECTOR in bridge.ts,
 * update the constants here to match.
 */

const TEXT_SELECTOR = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "li",
  "span",
  "a",
  "blockquote",
  "cite",
  "figcaption",
  "caption",
  "label",
  "dt",
  "dd",
  "td",
  "th",
  "pre",
  "code",
  "div.ve-card",
  "div.slide__kpi-val",
  "div.slide__kpi-label",
  "div.slide__kpi-trend",
  "div.slide__code-filename",
  "div.slide__body",
  "div.slide__aside",
].join(",");

const REORDERABLE_SELECTOR = [
  "section.slide > *",
  "section.slide > * > *",
  ".slide__panel > *",
  "ul.slide__bullets > li",
  "ol > li",
  "ul.node-list > li",
  "dl > dt",
  "dl > dd",
  ".card-grid > .ve-card",
  "div.slide__kpis > div.slide__kpi",
  "tbody > tr",
  "div.slide__panels > div.slide__panel",
].join(",");

function isTextElement(el: Element): boolean {
  if (!el || el.closest("svg") || el.closest("script")) return false;
  if (el.closest(".mermaid-wrap") || el.closest(".slide__decor")) return false;
  return el.closest(TEXT_SELECTOR) !== null;
}

function findHandleTarget(el: Element | null): Element | null {
  if (!el || el.tagName === "HTML" || el.tagName === "BODY") return null;
  if (el.classList?.contains("deck") || el.classList?.contains("slide"))
    return null;
  let target = el.closest(REORDERABLE_SELECTOR);
  while (target) {
    if (target.previousElementSibling || target.nextElementSibling)
      return target;
    target = target.parentElement?.closest(REORDERABLE_SELECTOR) ?? null;
  }
  return null;
}

function html(markup: string): HTMLElement {
  const div = document.createElement("div");
  div.innerHTML = markup;
  document.body.appendChild(div);
  return div;
}

describe("bridge selectors", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("TEXT_SELECTOR — text-editable elements", () => {
    it("matches standard text elements", () => {
      const root = html(
        '<section class="slide"><h1>Title</h1><h2>Sub</h2><p>Body</p><span>Inline</span></section>',
      );
      expect(isTextElement(root.querySelector("h1")!)).toBe(true);
      expect(isTextElement(root.querySelector("h2")!)).toBe(true);
      expect(isTextElement(root.querySelector("p")!)).toBe(true);
      expect(isTextElement(root.querySelector("span")!)).toBe(true);
    });

    it("matches h5, h6, a, dt, dd", () => {
      const root = html(
        '<section class="slide"><h5>H5</h5><h6>H6</h6><a href="#">Link</a><dl><dt>Term</dt><dd>Def</dd></dl></section>',
      );
      expect(isTextElement(root.querySelector("h5")!)).toBe(true);
      expect(isTextElement(root.querySelector("h6")!)).toBe(true);
      expect(isTextElement(root.querySelector("a")!)).toBe(true);
      expect(isTextElement(root.querySelector("dt")!)).toBe(true);
      expect(isTextElement(root.querySelector("dd")!)).toBe(true);
    });

    it("matches pre and code elements", () => {
      const root = html(
        '<section class="slide"><pre><code>const x = 1;</code></pre></section>',
      );
      expect(isTextElement(root.querySelector("pre")!)).toBe(true);
      expect(isTextElement(root.querySelector("code")!)).toBe(true);
    });

    it("matches .ve-card and KPI elements", () => {
      const root = html(`<section class="slide">
        <div class="ve-card">Card</div>
        <div class="slide__kpi-val">42</div>
        <div class="slide__kpi-label">Latency</div>
        <div class="slide__kpi-trend">down</div>
      </section>`);
      expect(isTextElement(root.querySelector(".ve-card")!)).toBe(true);
      expect(isTextElement(root.querySelector(".slide__kpi-val")!)).toBe(true);
      expect(isTextElement(root.querySelector(".slide__kpi-label")!)).toBe(
        true,
      );
      expect(isTextElement(root.querySelector(".slide__kpi-trend")!)).toBe(
        true,
      );
    });

    it("excludes elements inside SVG", () => {
      const root = html(
        '<section class="slide"><svg><text>SVG text</text></svg></section>',
      );
      expect(isTextElement(root.querySelector("text")!)).toBe(false);
    });

    it("excludes elements inside .mermaid-wrap", () => {
      const root = html(
        '<section class="slide"><div class="mermaid-wrap"><p>Diagram text</p></div></section>',
      );
      expect(isTextElement(root.querySelector("p")!)).toBe(false);
    });

    it("excludes elements inside .slide__decor", () => {
      const root = html(
        '<section class="slide"><div class="slide__decor"><span>Decor</span></div></section>',
      );
      expect(isTextElement(root.querySelector("span")!)).toBe(false);
    });
  });

  describe("REORDERABLE_SELECTOR — elements that get drag handles", () => {
    it("matches direct slide children", () => {
      const root = html(
        '<section class="slide"><h2>Title</h2><p>Body</p></section>',
      );
      const h2 = root.querySelector("h2")!;
      expect(h2.matches(REORDERABLE_SELECTOR)).toBe(true);
    });

    it("matches bullet list items", () => {
      const root = html(
        '<section class="slide"><ul class="slide__bullets"><li>A</li><li>B</li></ul></section>',
      );
      const li = root.querySelector("li")!;
      expect(li.matches(REORDERABLE_SELECTOR)).toBe(true);
    });

    it("matches KPI cards", () => {
      const root = html(`<section class="slide">
        <div class="slide__kpis">
          <div class="slide__kpi">A</div>
          <div class="slide__kpi">B</div>
        </div>
      </section>`);
      const kpi = root.querySelector(".slide__kpi")!;
      expect(kpi.matches(REORDERABLE_SELECTOR)).toBe(true);
    });

    it("matches table rows", () => {
      const root = html(
        '<section class="slide"><table><tbody><tr><td>A</td></tr><tr><td>B</td></tr></tbody></table></section>',
      );
      const tr = root.querySelector("tr")!;
      expect(tr.matches(REORDERABLE_SELECTOR)).toBe(true);
    });

    it("matches .ve-card in .card-grid", () => {
      const root = html(
        '<section class="slide"><div class="card-grid"><div class="ve-card">A</div><div class="ve-card">B</div></div></section>',
      );
      const card = root.querySelector(".ve-card")!;
      expect(card.matches(REORDERABLE_SELECTOR)).toBe(true);
    });

    it("matches split panel children", () => {
      const root = html(`<section class="slide">
        <div class="slide__panels">
          <div class="slide__panel"><p class="slide__label">A</p><h2>Title</h2></div>
        </div>
      </section>`);
      const label = root.querySelector(".slide__label")!;
      expect(label.matches(REORDERABLE_SELECTOR)).toBe(true);
    });

    it("KPI internal elements do NOT match reorderable", () => {
      const root = html(`<section class="slide">
        <div class="slide__kpis">
          <div class="slide__kpi">
            <div class="slide__kpi-val">42</div>
            <div class="slide__kpi-label">Latency</div>
          </div>
        </div>
      </section>`);
      const val = root.querySelector(".slide__kpi-val")!;
      // .slide__kpi-val should NOT independently match reorderable
      // (it's not a direct slide child/grandchild in this structure)
      expect(val.matches(REORDERABLE_SELECTOR)).toBe(false);
    });
  });

  describe("findHandleTarget — sibling walk-up", () => {
    it("returns the element if it has siblings", () => {
      const root = html('<section class="slide"><h2>A</h2><p>B</p></section>');
      const h2 = root.querySelector("h2")!;
      expect(findHandleTarget(h2)).toBe(h2);
    });

    it("returns null for a lone child with no reorderable ancestors", () => {
      const root = html(
        '<section class="slide"><div><p>Only child</p></div></section>',
      );
      // The <p> matches section.slide > * > * but has no siblings.
      // The parent <div> matches section.slide > * but also has no siblings.
      const p = root.querySelector("p")!;
      expect(findHandleTarget(p)).toBeNull();
    });

    it("walks up to parent when innermost match has no siblings", () => {
      const root = html(`<section class="slide">
        <div class="reveal"><p>Subtitle</p></div>
        <h1>Title</h1>
        <div class="reveal"><p>Another subtitle</p></div>
      </section>`);
      const p = root.querySelector("p")!;
      const target = findHandleTarget(p);
      // The <p> has no siblings, but its parent <div class="reveal"> does
      expect(target).toBe(p.parentElement);
      expect(target!.classList.contains("reveal")).toBe(true);
    });

    it("returns the KPI card, not its internal val/label", () => {
      const root = html(`<section class="slide">
        <div class="slide__kpis">
          <div class="slide__kpi"><div class="slide__kpi-val">42</div><div class="slide__kpi-label">Test</div></div>
          <div class="slide__kpi"><div class="slide__kpi-val">99</div><div class="slide__kpi-label">Other</div></div>
        </div>
      </section>`);
      const val = root.querySelector(".slide__kpi-val")!;
      const target = findHandleTarget(val);
      expect(target!.classList.contains("slide__kpi")).toBe(true);
    });

    it("walks up from h2 inside content slide .slide__inner > div wrapper", () => {
      const root = html(`<section class="slide slide--content">
        <div class="slide__inner">
          <div>
            <p class="slide__label">Label</p>
            <h2 class="slide__heading">Heading</h2>
            <ul class="slide__bullets"><li>A</li><li>B</li></ul>
          </div>
          <div class="slide__aside">Aside</div>
        </div>
      </section>`);
      const h2 = root.querySelector("h2")!;
      const target = findHandleTarget(h2);
      // h2 is 3 levels deep (section > .slide__inner > div > h2)
      // It should walk up to the plain div (which has a sibling: .slide__aside)
      expect(target).not.toBeNull();
      expect(target!.tagName).toBe("DIV");
    });

    it("skips deck and slide elements", () => {
      const root = html(
        '<div class="deck"><section class="slide"><p>Text</p></section></div>',
      );
      const slide = root.querySelector(".slide")!;
      expect(findHandleTarget(slide)).toBeNull();
    });
  });
});
