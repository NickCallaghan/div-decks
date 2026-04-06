import { useEffect, useRef } from "react";
import { useEditorStore } from "../store/editor-store";
import { usePresentation } from "./usePresentation";
import { useToastStore } from "../store/toast-store";

/** Extract deck name from pathname like /deck/my-presentation */
export function parseDeckPath(pathname: string): string | null {
  const match = pathname.match(/^\/deck\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Extract slide index from hash like #slide-3 (0-based internally, 1-based in URL) */
export function parseSlideHash(hash: string): number | null {
  const match = hash.match(/^#slide-(\d+)$/);
  if (!match) return null;
  const oneBasedIndex = parseInt(match[1], 10);
  return oneBasedIndex >= 1 ? oneBasedIndex - 1 : null;
}

/** Build the URL path for a given deck name */
export function buildDeckUrl(filename: string, slideIndex?: number): string {
  const name = filename.replace(/\.html$/, "");
  const path = `/deck/${encodeURIComponent(name)}`;
  if (slideIndex != null && slideIndex > 0) {
    return `${path}#slide-${slideIndex + 1}`;
  }
  return path;
}

/**
 * Syncs browser URL ↔ editor state.
 *
 * - On mount: opens a deck if the URL matches /deck/{name}
 * - On presentation change: pushes /deck/{name} or / to history
 * - On slide change: replaces hash #slide-N
 * - On popstate: navigates to the deck in the URL
 * - Auto-switches sidebar tab: "slides" when a deck is open, "files" when not
 */
export function useUrlRouting() {
  const { open } = usePresentation();
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const setActiveSlideIndex = useEditorStore((s) => s.setActiveSlideIndex);

  // Track whether we're handling a popstate to avoid pushing back to history
  const isPopstateRef = useRef(false);
  // Track the last URL we pushed to avoid duplicate pushes
  const lastPushedUrlRef = useRef(
    window.location.pathname + window.location.hash,
  );
  // Track whether the initial mount open has happened
  const mountedRef = useRef(false);

  // On mount: open deck from URL if path matches /deck/{name}
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const deckName = parseDeckPath(window.location.pathname);
    if (deckName) {
      const filename = deckName + ".html";
      const slideIndex = parseSlideHash(window.location.hash);
      open(filename)
        .then(() => {
          setActiveTab("slides");
          if (slideIndex != null) {
            setActiveSlideIndex(slideIndex);
          }
        })
        .catch(() => {
          useToastStore
            .getState()
            .addToast("error", "Failed to open deck from URL");
          window.history.replaceState(null, "", "/");
        });
    } else {
      // At root with no deck — ensure Files tab is active
      // (sessionStorage may still have "slides" from a prior session)
      setActiveTab("files");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to store changes and update URL reactively
  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe((state, prevState) => {
      // Presentation changed
      if (state.presentation !== prevState.presentation) {
        if (state.presentation) {
          setActiveTab("slides");
          const url = buildDeckUrl(
            state.presentation.filename,
            state.activeSlideIndex,
          );
          if (!isPopstateRef.current && lastPushedUrlRef.current !== url) {
            window.history.pushState(null, "", url);
            lastPushedUrlRef.current = url;
          }
        } else {
          setActiveTab("files");
          if (!isPopstateRef.current && lastPushedUrlRef.current !== "/") {
            window.history.pushState(null, "", "/");
            lastPushedUrlRef.current = "/";
          }
        }
        isPopstateRef.current = false;
        return;
      }

      // Slide index changed (same presentation)
      if (
        state.presentation &&
        state.activeSlideIndex !== prevState.activeSlideIndex
      ) {
        const url = buildDeckUrl(
          state.presentation.filename,
          state.activeSlideIndex,
        );
        window.history.replaceState(null, "", url);
        lastPushedUrlRef.current = url;
      }
    });

    return unsubscribe;
  }, [setActiveTab]);

  // Handle browser back/forward
  useEffect(() => {
    function handlePopstate() {
      isPopstateRef.current = true;
      lastPushedUrlRef.current =
        window.location.pathname + window.location.hash;

      const deckName = parseDeckPath(window.location.pathname);
      if (deckName) {
        const filename = deckName + ".html";
        const currentFilename =
          useEditorStore.getState().presentation?.filename;
        if (currentFilename === filename) {
          // Same deck — just update slide from hash
          const slideIndex = parseSlideHash(window.location.hash);
          if (slideIndex != null) {
            setActiveSlideIndex(slideIndex);
          }
          isPopstateRef.current = false;
        } else {
          const slideIndex = parseSlideHash(window.location.hash);
          open(filename)
            .then(() => {
              if (slideIndex != null) {
                setActiveSlideIndex(slideIndex);
              }
            })
            .catch(() => {
              useToastStore.getState().addToast("error", "Failed to open deck");
              isPopstateRef.current = false;
            });
        }
      } else {
        // Back to home — close presentation
        useEditorStore.getState().setPresentation(null);
      }
    }

    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, [open, setActiveSlideIndex]);
}
