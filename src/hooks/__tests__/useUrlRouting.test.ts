import { describe, it, expect } from "vitest";
import { parseDeckPath, parseSlideHash, buildDeckUrl } from "../useUrlRouting";

describe("parseDeckPath", () => {
  it("extracts deck name from /deck/my-presentation", () => {
    expect(parseDeckPath("/deck/my-presentation")).toBe("my-presentation");
  });

  it("returns null for root path", () => {
    expect(parseDeckPath("/")).toBeNull();
  });

  it("returns null for unrelated paths", () => {
    expect(parseDeckPath("/about")).toBeNull();
    expect(parseDeckPath("/deck/")).toBeNull();
  });

  it("returns null for nested paths beyond /deck/{name}", () => {
    expect(parseDeckPath("/deck/foo/bar")).toBeNull();
  });

  it("decodes URI-encoded deck names", () => {
    expect(parseDeckPath("/deck/my%20presentation")).toBe("my presentation");
  });

  it("handles deck names with hyphens and dots", () => {
    expect(parseDeckPath("/deck/q1-2026.report")).toBe("q1-2026.report");
  });
});

describe("parseSlideHash", () => {
  it("extracts 0-based index from #slide-1", () => {
    expect(parseSlideHash("#slide-1")).toBe(0);
  });

  it("extracts 0-based index from #slide-5", () => {
    expect(parseSlideHash("#slide-5")).toBe(4);
  });

  it("returns null for empty hash", () => {
    expect(parseSlideHash("")).toBeNull();
  });

  it("returns null for non-matching hash", () => {
    expect(parseSlideHash("#other")).toBeNull();
  });

  it("returns null for #slide-0 (1-based, 0 is invalid)", () => {
    expect(parseSlideHash("#slide-0")).toBeNull();
  });
});

describe("buildDeckUrl", () => {
  it("builds /deck/{name} from filename.html", () => {
    expect(buildDeckUrl("my-presentation.html")).toBe("/deck/my-presentation");
  });

  it("appends #slide-N for non-zero slide index", () => {
    expect(buildDeckUrl("demo.html", 2)).toBe("/deck/demo#slide-3");
  });

  it("omits hash for slide index 0", () => {
    expect(buildDeckUrl("demo.html", 0)).toBe("/deck/demo");
  });

  it("encodes special characters in filename", () => {
    expect(buildDeckUrl("my presentation.html")).toBe(
      "/deck/my%20presentation",
    );
  });

  it("handles filename without .html extension gracefully", () => {
    expect(buildDeckUrl("demo")).toBe("/deck/demo");
  });
});
