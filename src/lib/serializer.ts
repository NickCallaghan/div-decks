import type { PresentationModel } from "../types/presentation";

function cleanSlideHtml(outerHtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${outerHtml}</body>`, "text/html");
  const section = doc.body.firstElementChild;
  if (!section) return outerHtml;

  // Strip editor artifacts
  section.querySelectorAll("[data-se-selected]").forEach((el) => {
    el.removeAttribute("data-se-selected");
    (el as HTMLElement).style.outline = "";
    (el as HTMLElement).style.outlineOffset = "";
  });
  section.querySelectorAll("[contenteditable]").forEach((el) => {
    el.removeAttribute("contenteditable");
  });
  // Check the section itself and descendants
  if (section.classList.contains("se-dragging")) {
    section.classList.remove("se-dragging");
  }
  section.querySelectorAll(".se-dragging").forEach((el) => {
    el.classList.remove("se-dragging");
  });
  // Clean up empty style attributes left behind
  section.querySelectorAll('[style=""]').forEach((el) => {
    el.removeAttribute("style");
  });

  return section.outerHTML;
}

export function serializePresentation(model: PresentationModel): string {
  const lines: string[] = [];

  lines.push("<!DOCTYPE html>");
  lines.push('<html lang="en">');
  lines.push("<head>");
  lines.push(model.head);
  lines.push("</head>");
  lines.push("<body>");
  lines.push("");
  lines.push('<div class="deck">');
  lines.push("");

  for (const slide of model.slides) {
    if (slide.comment) {
      lines.push(`  ${slide.comment}`);
    }
    lines.push(`  ${cleanSlideHtml(slide.outerHtml)}`);
    lines.push("");
  }

  lines.push("</div><!-- /deck -->");
  lines.push("");
  lines.push(model.scriptBlock);
  lines.push("");
  lines.push("</body>");
  lines.push("</html>");
  lines.push("");

  return lines.join("\n");
}
