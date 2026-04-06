import { describe, it, expect } from "vitest";
import {
  stripPrintBlocks,
  addVisibleClass,
  removeScripts,
  fixGradientTextInDom,
  preparePrintHtml,
} from "../export-pdf";
import { parsePresentation } from "../parser";

describe("stripPrintBlocks", () => {
  it("removes a simple @media print block", () => {
    const input = `body { color: red; } @media print { body { color: black; } } .foo { margin: 0; }`;
    expect(stripPrintBlocks(input)).toBe(
      `body { color: red; }  .foo { margin: 0; }`,
    );
  });

  it("removes @media print with nested braces", () => {
    const input = `@media print { .a { color: red; } .b { margin: 0; } }`;
    expect(stripPrintBlocks(input)).toBe("");
  });

  it("removes multiple @media print blocks", () => {
    const input = `.a {} @media print { .b {} } .c {} @media print { .d {} }`;
    expect(stripPrintBlocks(input)).toBe(".a {}  .c {} ");
  });

  it("leaves other media queries intact", () => {
    const input = `@media screen { .a {} } @media print { .b {} } @media (max-width: 768px) { .c {} }`;
    expect(stripPrintBlocks(input)).toBe(
      `@media screen { .a {} }  @media (max-width: 768px) { .c {} }`,
    );
  });

  it("handles no @media print blocks", () => {
    const input = `.a { color: red; }`;
    expect(stripPrintBlocks(input)).toBe(input);
  });

  it("handles deeply nested braces", () => {
    const input = `@media print { .a { .b { color: red; } } }`;
    expect(stripPrintBlocks(input)).toBe("");
  });
});

describe("addVisibleClass", () => {
  it("adds visible to slide class", () => {
    expect(addVisibleClass('<section class="slide slide--title">')).toBe(
      '<section class="slide visible slide--title">',
    );
  });

  it("adds visible to bare slide class", () => {
    expect(addVisibleClass('<section class="slide">')).toBe(
      '<section class="slide visible">',
    );
  });

  it("does not match slide-something", () => {
    const input = '<div class="slide-container">';
    expect(addVisibleClass(input)).toBe(input);
  });

  it("handles multiple slides", () => {
    const input =
      '<section class="slide slide--title"></section><section class="slide slide--content"></section>';
    const result = addVisibleClass(input);
    expect(result).toContain('class="slide visible slide--title"');
    expect(result).toContain('class="slide visible slide--content"');
  });
});

describe("removeScripts", () => {
  it("removes script tags", () => {
    const input = "<div>hello</div><script>alert(1);</script><p>world</p>";
    expect(removeScripts(input)).toBe("<div>hello</div><p>world</p>");
  });

  it("removes multiline scripts", () => {
    const input = `<script>
  function init() {
    console.log("hello");
  }
</script>`;
    expect(removeScripts(input)).toBe("");
  });

  it("removes script tags with attributes", () => {
    const input = '<script type="module" src="app.js"></script>';
    expect(removeScripts(input)).toBe("");
  });

  it("handles no scripts", () => {
    const input = "<div>hello</div>";
    expect(removeScripts(input)).toBe(input);
  });
});

const MINIMAL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Test Deck</title>
<style>
.slide { height: 100dvh; }
@media print { .slide { height: auto; } }
</style>
</head>
<body>
<div class="deck">
  <section class="slide slide--title">
    <h1>Hello World</h1>
  </section>
  <section class="slide slide--content">
    <h2>Content</h2>
    <div class="reveal"><p>Details</p></div>
  </section>
</div>
<script>new SlideEngine();</script>
</body>
</html>`;

describe("preparePrintHtml", () => {
  it("strips existing @media print blocks", () => {
    const model = parsePresentation("test.html", MINIMAL_HTML);
    const html = preparePrintHtml(model);
    // The original @media print block should be gone
    expect(html).not.toContain(".slide { height: auto; }");
  });

  it("adds visible class to all slides", () => {
    const model = parsePresentation("test.html", MINIMAL_HTML);
    const html = preparePrintHtml(model);
    expect(html).toContain('class="slide visible slide--title"');
    expect(html).toContain('class="slide visible slide--content"');
  });

  it("removes script blocks", () => {
    const model = parsePresentation("test.html", MINIMAL_HTML);
    const html = preparePrintHtml(model);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("SlideEngine");
  });

  it("injects print override styles", () => {
    const model = parsePresentation("test.html", MINIMAL_HTML);
    const html = preparePrintHtml(model);
    expect(html).toContain('id="export-pdf-overrides"');
    expect(html).toContain("print-color-adjust: exact");
    expect(html).toContain("size: landscape");
    expect(html).toContain("page-break-after: always");
  });

  it("preserves non-print styles", () => {
    const model = parsePresentation("test.html", MINIMAL_HTML);
    const html = preparePrintHtml(model);
    expect(html).toContain(".slide { height: 100dvh; }");
  });

  it("preserves the head and structure", () => {
    const model = parsePresentation("test.html", MINIMAL_HTML);
    const html = preparePrintHtml(model);
    expect(html).toContain("<title>Test Deck</title>");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('<div class="deck">');
  });
});

describe("fixGradientTextInDom", () => {
  it("resets background and text-fill-color on elements with background-clip: text", () => {
    const doc = document.implementation.createHTMLDocument("test");

    const el = doc.createElement("h1");
    el.style.setProperty("background", "linear-gradient(135deg, #fff, #0fd)");
    el.style.setProperty("background-clip", "text");
    el.style.setProperty("-webkit-text-fill-color", "transparent");
    el.textContent = "Hello";
    doc.body.appendChild(el);

    fixGradientTextInDom(doc);

    expect(el.style.getPropertyValue("background")).toBe("none");
    expect(el.style.getPropertyValue("-webkit-text-fill-color")).toBe(
      "inherit",
    );
  });

  it("does not modify elements without background-clip: text", () => {
    const doc = document.implementation.createHTMLDocument("test");
    const el = doc.createElement("div");
    el.style.background = "red";
    doc.body.appendChild(el);

    fixGradientTextInDom(doc);

    expect(el.style.getPropertyValue("background")).not.toBe("none");
  });
});
