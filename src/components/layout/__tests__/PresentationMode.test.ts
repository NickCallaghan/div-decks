import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Unit tests for PresentationMode escape handling.
 *
 * PresentationMode registers two listeners on mount:
 * 1. window "keydown" (capture phase) — catches Escape when parent has focus
 * 2. window "message" — catches exit-presentation postMessage from iframe
 *
 * Since jsdom doesn't support iframes with srcdoc, we test the listeners
 * directly by dispatching events on window.
 */

describe("PresentationMode escape handling", () => {
  let cleanups: (() => void)[] = [];

  // Minimal re-implementation of the listener logic from PresentationMode,
  // so we can test it without rendering React (jsdom iframe limitations).
  function mountEscapeListeners(onExit: () => void) {
    const onExitRef = { current: onExit };

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onExitRef.current();
        return;
      }
      e.stopPropagation();
    }
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "exit-presentation") onExitRef.current();
    }

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("message", handleMessage);

    cleanups.push(() => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("message", handleMessage);
    });

    return onExitRef;
  }

  beforeEach(() => {
    cleanups = [];
  });

  afterEach(() => {
    cleanups.forEach((fn) => fn());
  });

  it("calls onExit when Escape keydown fires on window", () => {
    const onExit = vi.fn();
    mountEscapeListeners(onExit);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("calls onExit when exit-presentation message is received", () => {
    const onExit = vi.fn();
    mountEscapeListeners(onExit);

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "exit-presentation" },
      }),
    );

    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("does not call onExit for non-Escape keys", () => {
    const onExit = vi.fn();
    mountEscapeListeners(onExit);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(onExit).not.toHaveBeenCalled();
  });

  it("does not call onExit for unrelated messages", () => {
    const onExit = vi.fn();
    mountEscapeListeners(onExit);

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "dom-change" },
      }),
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "element-selected" },
      }),
    );

    expect(onExit).not.toHaveBeenCalled();
  });

  it("stops propagation of Escape keydown", () => {
    const onExit = vi.fn();
    mountEscapeListeners(onExit);

    const bubbleHandler = vi.fn();
    window.addEventListener("keydown", bubbleHandler);
    cleanups.push(() => window.removeEventListener("keydown", bubbleHandler));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    // The capture handler should have stopped propagation,
    // so the bubble handler should not see the event
    expect(bubbleHandler).not.toHaveBeenCalled();
  });

  it("uses latest onExit ref when callback changes", () => {
    const onExit1 = vi.fn();
    const onExit2 = vi.fn();
    const ref = mountEscapeListeners(onExit1);

    // Simulate React updating the ref (as happens on re-render)
    ref.current = onExit2;

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onExit1).not.toHaveBeenCalled();
    expect(onExit2).toHaveBeenCalledTimes(1);
  });
});
