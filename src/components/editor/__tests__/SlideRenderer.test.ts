import { dispatchSlideMessage } from "../slide-message";

function makeActions() {
  return {
    updateSlideHtml: vi.fn(),
    setSelectedElement: vi.fn(),
    setIsEditing: vi.fn(),
  };
}

describe("dispatchSlideMessage", () => {
  it("dispatches element-clicked to setSelectedElement", () => {
    const actions = makeActions();
    dispatchSlideMessage(
      {
        type: "element-clicked",
        selector: "p.intro",
        tagName: "P",
        className: "intro",
        text: "Hello",
        rect: { top: 10, left: 20, width: 100, height: 30 },
      },
      "slide-1",
      actions,
    );

    expect(actions.setSelectedElement).toHaveBeenCalledWith({
      selector: "p.intro",
      tagName: "P",
      className: "intro",
      text: "Hello",
      rect: { top: 10, left: 20, width: 100, height: 30 },
    });
  });

  it("dispatches dom-updated to updateSlideHtml with slide id", () => {
    const actions = makeActions();
    dispatchSlideMessage(
      { type: "dom-updated", outerHtml: "<section>new</section>" },
      "slide-42",
      actions,
    );

    expect(actions.updateSlideHtml).toHaveBeenCalledWith(
      "slide-42",
      "<section>new</section>",
    );
  });

  it("dispatches editing-started", () => {
    const actions = makeActions();
    dispatchSlideMessage({ type: "editing-started" }, "slide-1", actions);
    expect(actions.setIsEditing).toHaveBeenCalledWith(true);
  });

  it("dispatches editing-finished", () => {
    const actions = makeActions();
    dispatchSlideMessage({ type: "editing-finished" }, "slide-1", actions);
    expect(actions.setIsEditing).toHaveBeenCalledWith(false);
  });

  it("dispatches element-deselected", () => {
    const actions = makeActions();
    dispatchSlideMessage({ type: "element-deselected" }, "slide-1", actions);
    expect(actions.setSelectedElement).toHaveBeenCalledWith(null);
  });

  it("ignores unknown message types", () => {
    const actions = makeActions();
    dispatchSlideMessage({ type: "unknown-type" }, "slide-1", actions);
    expect(actions.updateSlideHtml).not.toHaveBeenCalled();
    expect(actions.setSelectedElement).not.toHaveBeenCalled();
    expect(actions.setIsEditing).not.toHaveBeenCalled();
  });
});
