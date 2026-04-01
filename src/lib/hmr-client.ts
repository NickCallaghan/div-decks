import { fetchPresentation } from "../api/presentations";
import { parsePresentation } from "./parser";
import { useEditorStore } from "../store/editor-store";

let suppressUntil = 0;

/** Call before an editor-initiated save to skip the next HMR re-fetch. */
export function suppressNextHmr() {
  suppressUntil = Date.now() + 2000;
}

if (import.meta.hot) {
  import.meta.hot.on(
    "presentation-changed",
    async (data: { filename: string }) => {
      // Skip if this was triggered by the editor's own save
      if (Date.now() < suppressUntil) {
        suppressUntil = 0;
        return;
      }

      const { presentation } = useEditorStore.getState();
      if (presentation && presentation.filename === data.filename) {
        // External change — re-fetch and update seamlessly
        const html = await fetchPresentation(data.filename);
        const model = parsePresentation(data.filename, html);
        useEditorStore.getState().setPresentation(model);
        useEditorStore.getState().setSavedHtml(html);
      }
    },
  );
}
