/** Dispatch a bridge postMessage to the appropriate store action. */
export function dispatchSlideMessage(
  data: { type: string; [key: string]: unknown },
  slideId: string,
  actions: {
    updateSlideHtml: (id: string, html: string) => void;
    setSelectedElement: (
      el: {
        selector: string;
        tagName: string;
        className: string;
        text: string;
        rect: { top: number; left: number; width: number; height: number };
      } | null,
    ) => void;
    setIsEditing: (v: boolean) => void;
  },
): void {
  switch (data.type) {
    case "element-clicked":
      actions.setSelectedElement({
        selector: data.selector as string,
        tagName: data.tagName as string,
        className: data.className as string,
        text: data.text as string,
        rect: data.rect as {
          top: number;
          left: number;
          width: number;
          height: number;
        },
      });
      break;
    case "dom-updated":
      actions.updateSlideHtml(slideId, data.outerHtml as string);
      break;
    case "editing-started":
      actions.setIsEditing(true);
      break;
    case "editing-finished":
      actions.setIsEditing(false);
      break;
    case "element-deselected":
      actions.setSelectedElement(null);
      break;
  }
}
