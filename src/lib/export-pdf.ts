import type { PresentationModel } from "../types/presentation";
import { serializePresentation } from "./serializer";

const PRINT_STYLES = `
<style id="export-pdf-overrides">
/* Override outside @media print too — this HTML is only used for printing */
.slide,
.slide .reveal {
  opacity: 1 !important;
  transform: none !important;
  transition: none !important;
}

@media print {
  @page {
    size: landscape;
    margin: 0;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  body {
    overflow: visible !important;
    margin: 0 !important;
  }

  .deck {
    height: auto !important;
    overflow: visible !important;
    scroll-snap-type: none !important;
    scroll-behavior: auto !important;
  }

  .slide {
    height: 100vh !important;
    page-break-after: always;
    page-break-inside: avoid;
    break-after: page;
    break-inside: avoid;
    overflow: hidden !important;
  }

  .slide:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  /* Hide navigation chrome */
  .deck-progress,
  .deck-dots,
  .deck-counter,
  .deck-hints {
    display: none !important;
  }

}
</style>`;

/**
 * Strip all @media print { ... } blocks from a string, handling nested braces.
 */
export function stripPrintBlocks(input: string): string {
  let result = input;
  while (true) {
    const idx = result.search(/@media\s+print\s*\{/);
    if (idx === -1) break;

    const matchLen = result.slice(idx).match(/@media\s+print\s*\{/)![0].length;
    let depth = 1;
    let i = idx + matchLen;
    while (i < result.length && depth > 0) {
      if (result[i] === "{") depth++;
      else if (result[i] === "}") depth--;
      i++;
    }
    result = result.slice(0, idx) + result.slice(i);
  }
  return result;
}

/**
 * Add .visible class to all slide sections so animations resolve.
 */
export function addVisibleClass(html: string): string {
  return html.replace(/class="slide(?![\w-])/g, 'class="slide visible');
}

/**
 * Remove all <script> blocks from the HTML.
 */
export function removeScripts(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "");
}

/**
 * Fix gradient text in the live DOM of the print window.
 * Finds elements using background-clip: text (which breaks in print)
 * and resets them to use solid text color instead.
 */
export function fixGradientTextInDom(doc: Document): void {
  const all = doc.querySelectorAll("*");
  for (const el of all) {
    const computed = doc.defaultView?.getComputedStyle(el);
    const inline = (el as HTMLElement).style;
    const clip =
      computed?.getPropertyValue("background-clip") ||
      computed?.getPropertyValue("-webkit-background-clip") ||
      inline?.getPropertyValue("background-clip") ||
      inline?.getPropertyValue("-webkit-background-clip");
    if (clip === "text") {
      (el as HTMLElement).style.setProperty("background", "none", "important");
      (el as HTMLElement).style.setProperty(
        "-webkit-text-fill-color",
        "inherit",
        "important",
      );
      (el as HTMLElement).style.setProperty(
        "background-clip",
        "border-box",
        "important",
      );
      (el as HTMLElement).style.setProperty(
        "-webkit-background-clip",
        "border-box",
        "important",
      );
    }
  }
}

/**
 * Prepare the full print-ready HTML from a presentation model.
 */
export function preparePrintHtml(model: PresentationModel): string {
  let html = serializePresentation(model);
  html = stripPrintBlocks(html);
  html = addVisibleClass(html);
  html = removeScripts(html);
  html = html.replace("</head>", PRINT_STYLES + "\n</head>");
  return html;
}

/**
 * Export the presentation as a PDF via the browser's print dialog.
 */
export function exportPdf(model: PresentationModel): void {
  const html = preparePrintHtml(model);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups to export this presentation as PDF.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.addEventListener("load", () => {
    const fontsReady = printWindow.document.fonts?.ready ?? Promise.resolve();
    fontsReady.then(() => {
      fixGradientTextInDom(printWindow.document);
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    });
  });
}
