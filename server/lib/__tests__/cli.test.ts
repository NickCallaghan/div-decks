import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const cliPath = path.resolve(import.meta.dirname, "..", "..", "cli.ts");

describe("cli.ts", () => {
  it("exports DECKS_COMMAND_TEMPLATE with correct command name", async () => {
    const content = fs.readFileSync(cliPath, "utf-8");
    // Command should create decks.md, not presentations.md
    expect(content).toContain('"decks.md"');
    expect(content).not.toContain('"presentations.md"');
  });

  it("references /decks and /new-deck in setup complete message", () => {
    const content = fs.readFileSync(cliPath, "utf-8");
    expect(content).toContain("/decks");
    expect(content).toContain("/new-deck");
  });

  it("installs skill via claude CLI marketplace commands", () => {
    const content = fs.readFileSync(cliPath, "utf-8");
    expect(content).toContain("plugin marketplace add NickCallaghan/div-decks");
    expect(content).toContain(
      "plugin install --scope project new-deck@div-decks",
    );
  });

  it("includes manual install instructions as fallback", () => {
    const content = fs.readFileSync(cliPath, "utf-8");
    expect(content).toContain(
      "claude plugin install --scope project new-deck@div-decks",
    );
  });
});

describe("new-deck skill files", () => {
  const skillDir = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "new-deck",
  );

  it("has SKILL.md with correct frontmatter", () => {
    const content = fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf-8");
    expect(content).toContain("name: new-deck");
    expect(content).toContain("version:");
  });

  it("has package.json with pi-package keyword", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(skillDir, "package.json"), "utf-8"),
    );
    expect(pkg.name).toBe("new-deck");
    expect(pkg.keywords).toContain("pi-package");
    expect(pkg.pi.skills).toBeDefined();
    expect(pkg.pi.prompts).toBeDefined();
  });

  it("has prompt file for /new-deck command", () => {
    const content = fs.readFileSync(
      path.join(skillDir, "prompts", "new-deck.md"),
      "utf-8",
    );
    expect(content).toContain("description:");
    expect(content).toContain("slide deck");
  });

  it("has all required reference files", () => {
    const refs = [
      "slide-engine.md",
      "slide-types.md",
      "css-core.md",
      "branding.md",
    ];
    for (const ref of refs) {
      expect(fs.existsSync(path.join(skillDir, "references", ref))).toBe(true);
    }
  });

  it("has template deck with SlideEngine", () => {
    const content = fs.readFileSync(
      path.join(skillDir, "templates", "slide-deck.html"),
      "utf-8",
    );
    expect(content).toContain("SlideEngine");
    expect(content).toContain('class="deck"');
    expect(
      (content.match(/class="slide /g) || []).length,
    ).toBeGreaterThanOrEqual(5);
  });

  it("slide-engine reference contains complete engine code", () => {
    const content = fs.readFileSync(
      path.join(skillDir, "references", "slide-engine.md"),
      "utf-8",
    );
    expect(content).toContain("buildChrome");
    expect(content).toContain("bindEvents");
    expect(content).toContain("IntersectionObserver");
    expect(content).toContain("goTo");
  });

  it("css-core reference contains required structural CSS", () => {
    const content = fs.readFileSync(
      path.join(skillDir, "references", "css-core.md"),
      "utf-8",
    );
    expect(content).toContain("scroll-snap-type");
    expect(content).toContain("100dvh");
    expect(content).toContain(".reveal");
    expect(content).toContain("deck-progress");
    expect(content).toContain("prefers-reduced-motion");
  });

  it("branding reference documents safe/unsafe boundaries", () => {
    const content = fs.readFileSync(
      path.join(skillDir, "references", "branding.md"),
      "utf-8",
    );
    expect(content).toContain("--accent");
    expect(content).toContain("must NOT");
  });

  it("has MIT LICENSE", () => {
    const content = fs.readFileSync(path.join(skillDir, "LICENSE"), "utf-8");
    expect(content).toContain("MIT License");
    expect(content).toContain("Nick Callaghan");
  });
});
