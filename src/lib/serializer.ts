import type { PresentationModel } from '../types/presentation';

export function serializePresentation(model: PresentationModel): string {
  const lines: string[] = [];

  lines.push('<!DOCTYPE html>');
  lines.push('<html lang="en">');
  lines.push('<head>');
  lines.push(model.head);
  lines.push('</head>');
  lines.push('<body>');
  lines.push('');
  lines.push('<div class="deck">');
  lines.push('');

  for (const slide of model.slides) {
    if (slide.comment) {
      lines.push(`  ${slide.comment}`);
    }
    lines.push(`  ${slide.outerHtml}`);
    lines.push('');
  }

  lines.push('</div><!-- /deck -->');
  lines.push('');
  lines.push(model.scriptBlock);
  lines.push('');
  lines.push('</body>');
  lines.push('</html>');
  lines.push('');

  return lines.join('\n');
}
