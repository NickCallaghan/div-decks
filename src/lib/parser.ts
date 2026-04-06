import { v4 as uuid } from "uuid";
import type {
  PresentationModel,
  SlideModel,
  SlideType,
} from "../types/presentation";

const SLIDE_TYPE_REGEX = /slide--(\w+)/;

function parseSlideType(className: string): SlideType {
  const match = className.match(SLIDE_TYPE_REGEX);
  if (!match) return "unknown";
  return match[1];
}

function extractComments(rawHtml: string): Map<number, string> {
  // Find HTML comments that precede slide sections
  const comments = new Map<number, string>();
  const commentRegex = /<!--\s*(.*?)\s*-->\s*\n\s*<section/g;
  let match;
  while ((match = commentRegex.exec(rawHtml)) !== null) {
    // Store the comment keyed by its position in the raw HTML
    const sectionStart = rawHtml.indexOf(
      "<section",
      match.index + match[0].length - "<section".length,
    );
    comments.set(sectionStart, `<!-- ${match[1]} -->`);
  }
  return comments;
}

export function parsePresentation(
  filename: string,
  rawHtml: string,
): PresentationModel {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");

  // Extract title
  const title =
    doc.querySelector("title")?.textContent ?? filename.replace(".html", "");

  // Extract head content
  const head = doc.head.innerHTML;

  // Extract script blocks from body
  const scripts = Array.from(doc.body.querySelectorAll("script"));
  const scriptBlock = scripts.map((s) => s.outerHTML).join("\n\n");

  // Extract slides
  const slideElements = doc.querySelectorAll(".slide");
  const comments = extractComments(rawHtml);

  const slides: SlideModel[] = Array.from(slideElements).map((el, index) => {
    const outerHtml = el.outerHTML;
    const type = parseSlideType(el.className);

    // Try to find a matching comment for this slide
    let comment: string | undefined;
    const slideHtmlInRaw = rawHtml.indexOf(outerHtml.slice(0, 60));
    for (const [pos, commentText] of comments) {
      if (Math.abs(pos - slideHtmlInRaw) < 200) {
        comment = commentText;
        comments.delete(pos);
        break;
      }
    }

    return {
      id: uuid(),
      index,
      type,
      outerHtml,
      comment,
    };
  });

  return { filename, title, head, slides, scriptBlock };
}
