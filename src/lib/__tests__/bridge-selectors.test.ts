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
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "ul",
  "ol",
  "li",
  "blockquote",
  "cite",
  "pre",
  "dl",
  "dt",
  "dd",
  "section.slide > *",
  "div.ve-card",
  "div.slide__kpi",
  "div.slide__panel",
  "tbody > tr",
].join(",");

function isAtomicContainer(el: Element | null): Element | null {
  let cur = el;
  while (cur && cur.tagName !== "SECTION") {
    // Explicit opt-in via data attribute
    if (cur.hasAttribute && cur.hasAttribute("data-se-atomic")) return cur;
    if (cur.classList) {
      for (let i = 0; i < cur.classList.length; i++) {
        const cls = cur.classList[i];
        if (
          /card$/.test(cls) ||
          cls === "slide__kpi" ||
          cls === "slide__panel" ||
          cls === "status" ||
          cls === "tag"
        ) {
          return cur;
        }
      }
    }
    cur = cur.parentElement;
  }
  return null;
}

function isTextElement(el: Element): boolean {
  if (!el || el.closest("svg") || el.closest("script")) return false;
  if (el.closest(".mermaid-wrap") || el.closest(".slide__decor")) return false;
  // Explicit opt-out via data attribute
  if (
    el.hasAttribute("data-se-editable") &&
    el.getAttribute("data-se-editable") === "false"
  )
    return false;
  if (el.closest(TEXT_SELECTOR) !== null) return true;
  // Leaf-div heuristic: a <div> with no child elements and text content
  if (
    el.tagName === "DIV" &&
    el.children.length === 0 &&
    el.textContent?.trim()
  )
    return true;
  return false;
}

function hasSimilarSiblings(el: Element): boolean {
  if (!el.classList || el.classList.length === 0) return false;
  const parent = el.parentElement;
  if (!parent) return false;
  const siblings = parent.children;
  for (let i = 0; i < siblings.length; i++) {
    const sib = siblings[i];
    if (sib === el) continue;
    if (sib.tagName !== el.tagName) continue;
    if (!sib.classList || sib.classList.length === 0) continue;
    for (let j = 0; j < el.classList.length; j++) {
      if (sib.classList.contains(el.classList[j])) return true;
    }
  }
  return false;
}

function findHandleTarget(el: Element | null): Element | null {
  if (!el || el.tagName === "HTML" || el.tagName === "BODY") return null;
  if (el.classList?.contains("deck") || el.classList?.contains("slide"))
    return null;
  // Explicit data-se-reorderable attribute — highest priority
  if (el.hasAttribute && el.hasAttribute("data-se-reorderable")) {
    if (el.previousElementSibling || el.nextElementSibling) return el;
  }
  // Atomic containers absorb their children
  const atomic = isAtomicContainer(el);
  if (atomic) {
    if (atomic.previousElementSibling || atomic.nextElementSibling)
      return atomic;
    return null;
  }
  // Sibling-homogeneity heuristic — runs before selector walk-up so
  // inner repeating components are found before broader matches
  let cur: Element | null = el;
  while (cur && cur.tagName !== "SECTION") {
    if (cur.classList?.contains("deck") || cur.classList?.contains("slide"))
      break;
    if (hasSimilarSiblings(cur)) return cur;
    cur = cur.parentElement;
  }
  // Walk up through REORDERABLE_SELECTOR matches
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

    it("h2 inside content slide matches directly as semantic element", () => {
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
      // h2 matches directly as a semantic element, has siblings (p, ul)
      expect(target).not.toBeNull();
      expect(target!.tagName).toBe("H2");
    });

    it("hovering text inside a turtle-card returns the card", () => {
      const root = html(`<section class="slide">
        <div class="turtle-grid">
          <div class="turtle-card"><div class="turtle-card__name">Leonardo</div><div class="turtle-card__desc">Leader</div></div>
          <div class="turtle-card"><div class="turtle-card__name">Raphael</div><div class="turtle-card__desc">Hothead</div></div>
        </div>
      </section>`);
      const name = root.querySelector(".turtle-card__name")!;
      const target = findHandleTarget(name);
      expect(target).not.toBeNull();
      expect(target!.classList.contains("turtle-card")).toBe(true);
    });

    it("any *-card class is atomic (generic pattern)", () => {
      const root = html(`<section class="slide">
        <div class="my-grid">
          <div class="custom-card"><h4>Title</h4></div>
          <div class="custom-card"><h4>Other</h4></div>
        </div>
      </section>`);
      const h4 = root.querySelector("h4")!;
      const target = findHandleTarget(h4);
      expect(target!.classList.contains("custom-card")).toBe(true);
    });

    it("status badges are atomic (selectable and draggable as units)", () => {
      const root = html(`<section class="slide">
        <div>
          <span class="status status--match">Match</span>
          <span class="status status--gap">Gap</span>
          <span class="tag">v2.0</span>
        </div>
      </section>`);
      const badge = root.querySelector(".status--match")!;
      const target = findHandleTarget(badge);
      expect(target).not.toBeNull();
      expect(target!.classList.contains("status")).toBe(true);
    });

    it("elements inside slide__inner are NOT atomic (layout grid)", () => {
      const root = html(`<section class="slide">
        <div class="slide__inner" style="display:grid;">
          <div><p>Left column</p><h2>Heading</h2></div>
          <div class="slide__aside"><p>Right column</p></div>
        </div>
      </section>`);
      const h2 = root.querySelector("h2")!;
      const target = findHandleTarget(h2);
      // h2 should get its own handle, not be absorbed by the layout div
      expect(target).not.toBeNull();
      expect(target!.tagName).toBe("H2");
    });

    it("hovering h4 inside a ve-card returns the card, not the h4", () => {
      const root = html(`<section class="slide">
        <div class="card-grid">
          <div class="ve-card"><h4>Title</h4><p>Desc</p></div>
          <div class="ve-card"><h4>Other</h4><p>Desc</p></div>
        </div>
      </section>`);
      const h4 = root.querySelector("h4")!;
      const target = findHandleTarget(h4);
      expect(target).not.toBeNull();
      expect(target!.classList.contains("ve-card")).toBe(true);
    });

    it("hovering KPI value returns the KPI card, not the value", () => {
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

    it("hovering p inside a panel returns the panel", () => {
      const root = html(`<section class="slide">
        <div class="slide__panels">
          <div class="slide__panel"><p>Panel A content</p></div>
          <div class="slide__panel"><p>Panel B content</p></div>
        </div>
      </section>`);
      const p = root.querySelector("p")!;
      const target = findHandleTarget(p);
      expect(target!.classList.contains("slide__panel")).toBe(true);
    });

    it("lone atomic container with no siblings returns null", () => {
      const root = html(`<section class="slide">
        <div class="slide__aside">
          <div class="ve-card"><h4>Only card</h4></div>
        </div>
      </section>`);
      const h4 = root.querySelector("h4")!;
      const target = findHandleTarget(h4);
      // The ve-card has no siblings, so no handle
      expect(target).toBeNull();
    });

    it("skips deck and slide elements", () => {
      const root = html(
        '<div class="deck"><section class="slide"><p>Text</p></section></div>',
      );
      const slide = root.querySelector(".slide")!;
      expect(findHandleTarget(slide)).toBeNull();
    });
  });

  describe("sibling-homogeneity heuristic — generic brand components", () => {
    it("detects repeating components by shared tag+class", () => {
      const root = html(`<section class="slide">
        <div class="flow-steps">
          <div class="flow-step"><span>Step 1</span></div>
          <div class="flow-step"><span>Step 2</span></div>
          <div class="flow-step"><span>Step 3</span></div>
        </div>
      </section>`);
      const step = root.querySelectorAll(".flow-step")[1];
      const target = findHandleTarget(step);
      expect(target).not.toBeNull();
      expect(target!.classList.contains("flow-step")).toBe(true);
    });

    it("detects reveal-wrapped siblings as reorderable", () => {
      const root = html(`<section class="slide">
        <div style="display:flex;flex-direction:column;">
          <div class="reveal" style="background:#222;">Card A</div>
          <div class="reveal" style="background:#222;">Card B</div>
          <div class="reveal" style="background:#222;">Card C</div>
        </div>
      </section>`);
      const card = root.querySelectorAll(".reveal")[1];
      const target = findHandleTarget(card);
      expect(target).not.toBeNull();
      expect(target!.classList.contains("reveal")).toBe(true);
    });

    it("does NOT match siblings with different tags even if they share a class", () => {
      const root = html(`<section class="slide">
        <div class="content">
          <p class="reveal">Label</p>
          <h2 class="reveal">Heading</h2>
          <div class="reveal">Card</div>
        </div>
      </section>`);
      // p.reveal has no same-tag sibling with shared class, only h2 and div
      // but p already matches REORDERABLE_SELECTOR so it gets a handle from there
      const divReveal = root.querySelector("div.reveal")!;
      // The div.reveal has no same-tag+class sibling (h2 and p have different tags)
      const target = findHandleTarget(divReveal);
      // div.reveal is the only div with class "reveal" — no similar siblings
      expect(target).toBeNull();
    });

    it("does NOT match classless siblings", () => {
      const root = html(`<section class="slide">
        <div class="grid">
          <div>Column A</div>
          <div>Column B</div>
        </div>
      </section>`);
      const col = root.querySelector(".grid > div")!;
      const target = findHandleTarget(col);
      expect(target).toBeNull();
    });

    it("prefers inner reveal siblings over outer section.slide > * wrapper", () => {
      const root = html(`<section class="slide">
        <p>Label</p>
        <h2>Heading</h2>
        <div style="display:flex;flex-direction:column;gap:20px;">
          <div class="reveal" style="background:#222;padding:20px;">Card 1</div>
          <div class="reveal" style="background:#222;padding:20px;">Card 2</div>
          <div class="reveal" style="background:#222;padding:20px;">Card 3</div>
        </div>
      </section>`);
      // Click on inner text of first card — should select the .reveal card,
      // NOT the outer classless wrapper (which matches section.slide > *)
      const innerText = root.querySelector(".reveal")!;
      const target = findHandleTarget(innerText);
      expect(target).not.toBeNull();
      expect(target!.classList.contains("reveal")).toBe(true);
    });

    it("walks up from deep inner element to reveal card sibling", () => {
      const root = html(`<section class="slide">
        <h2>Title</h2>
        <div style="display:grid;">
          <div class="reveal" style="background:#222;">
            <div style="font-size:48px;">01</div>
            <div><div style="font-size:22px;">AI-First Development</div></div>
          </div>
          <div class="reveal" style="background:#222;">
            <div style="font-size:48px;">02</div>
            <div><div style="font-size:22px;">Data Model</div></div>
          </div>
        </div>
      </section>`);
      // Click deep inside first card — should walk up to .reveal
      const deepDiv = root.querySelector(".reveal div div")!;
      const target = findHandleTarget(deepDiv);
      expect(target).not.toBeNull();
      expect(target!.classList.contains("reveal")).toBe(true);
    });

    it("does NOT match siblings with entirely different classes", () => {
      const root = html(`<section class="slide">
        <div class="slide__inner">
          <div class="slide__text">Left content</div>
          <div class="slide__aside">Right content</div>
        </div>
      </section>`);
      const text = root.querySelector(".slide__text")!;
      const target = findHandleTarget(text);
      // These are structural columns, not a repeating group
      expect(target).toBeNull();
    });

    it("walks up to find the repeating ancestor", () => {
      const root = html(`<section class="slide">
        <div class="steps">
          <div class="step"><span class="step__num">1</span><span class="step__text">Do X</span></div>
          <div class="step"><span class="step__num">2</span><span class="step__text">Do Y</span></div>
        </div>
      </section>`);
      // Click on the inner span — should walk up to .step
      const span = root.querySelector(".step__text")!;
      const target = findHandleTarget(span);
      expect(target).not.toBeNull();
      expect(target!.classList.contains("step")).toBe(true);
    });

    it("stops walk-up at slide boundary", () => {
      const root = html(`<section class="slide">
        <div class="only-child">
          <div class="also-only-child">
            <span>Deep text</span>
          </div>
        </div>
      </section>`);
      const span = root.querySelector("span")!;
      expect(findHandleTarget(span)).toBeNull();
    });
  });

  describe("leaf-div text editability", () => {
    it("treats a text-only div as editable", () => {
      const root = html(`<section class="slide">
        <div style="font-size:22px;">AI-First Development</div>
      </section>`);
      const div = root.querySelector("div[style]")!;
      expect(isTextElement(div)).toBe(true);
    });

    it("does NOT treat a div with child elements as editable", () => {
      const root = html(`<section class="slide">
        <div class="card"><h4>Title</h4><p>Desc</p></div>
      </section>`);
      const card = root.querySelector(".card")!;
      expect(isTextElement(card)).toBe(false);
    });

    it("does NOT treat an empty div as editable", () => {
      const root = html(`<section class="slide">
        <div class="spacer"></div>
      </section>`);
      const spacer = root.querySelector(".spacer")!;
      expect(isTextElement(spacer)).toBe(false);
    });

    it("does NOT treat a whitespace-only div as editable", () => {
      const root = html(`<section class="slide">
        <div class="empty">   </div>
      </section>`);
      const empty = root.querySelector(".empty")!;
      expect(isTextElement(empty)).toBe(false);
    });
  });

  describe("data-attribute protocol", () => {
    it("data-se-reorderable makes an element draggable", () => {
      const root = html(`<section class="slide">
        <div class="custom-wrapper">
          <div data-se-reorderable class="thing">A</div>
          <div data-se-reorderable class="thing">B</div>
        </div>
      </section>`);
      const thing = root.querySelector(".thing")!;
      const target = findHandleTarget(thing);
      expect(target).not.toBeNull();
      expect(target!.classList.contains("thing")).toBe(true);
    });

    it("data-se-atomic makes children non-independently draggable", () => {
      const root = html(`<section class="slide">
        <div class="wrapper">
          <div data-se-atomic class="complex-widget"><h4>Title</h4><p>Desc</p></div>
          <div data-se-atomic class="complex-widget"><h4>Other</h4><p>Desc</p></div>
        </div>
      </section>`);
      const h4 = root.querySelector("h4")!;
      const target = findHandleTarget(h4);
      expect(target).not.toBeNull();
      expect(target!.classList.contains("complex-widget")).toBe(true);
    });

    it("data-se-editable=false excludes text elements from editing", () => {
      const root = html(`<section class="slide">
        <p data-se-editable="false">Decorative text</p>
      </section>`);
      const p = root.querySelector("p")!;
      expect(isTextElement(p)).toBe(false);
    });

    it("data-se-editable=false excludes leaf divs from editing", () => {
      const root = html(`<section class="slide">
        <div data-se-editable="false">↓</div>
      </section>`);
      const div = root.querySelector("div[data-se-editable]")!;
      expect(isTextElement(div)).toBe(false);
    });
  });
});
