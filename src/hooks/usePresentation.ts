import { useCallback } from "react";
import { fetchPresentation, savePresentation } from "../api/presentations";
import { parsePresentation } from "../lib/parser";
import { serializePresentation } from "../lib/serializer";
import { useEditorStore } from "../store/editor-store";

export function usePresentation() {
  const presentation = useEditorStore((s) => s.presentation);
  const setPresentation = useEditorStore((s) => s.setPresentation);
  const setSavedHtml = useEditorStore((s) => s.setSavedHtml);
  const setIsDirty = useEditorStore((s) => s.setIsDirty);

  const open = useCallback(
    async (filename: string) => {
      const html = await fetchPresentation(filename);
      const model = parsePresentation(filename, html);
      setPresentation(model);
      setSavedHtml(html);
    },
    [setPresentation, setSavedHtml],
  );

  const save = useCallback(async () => {
    if (!presentation) return;
    const html = serializePresentation(presentation);
    await savePresentation(presentation.filename, html);
    setSavedHtml(html);
    setIsDirty(false);
  }, [presentation, setSavedHtml, setIsDirty]);

  return { presentation, open, save };
}
