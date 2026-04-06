import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const cliPath = path.resolve(import.meta.dirname, "..", "..", "cli.ts");

describe("cli.ts", () => {
  it("creates decks.md command, not presentations.md", () => {
    const content = fs.readFileSync(cliPath, "utf-8");
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

describe("new-deck plugin structure", () => {
  const pluginDir = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "new-deck",
  );

  it("has .claude-plugin/plugin.json with correct metadata", () => {
    const plugin = JSON.parse(
      fs.readFileSync(
        path.join(pluginDir, ".claude-plugin", "plugin.json"),
        "utf-8",
      ),
    );
    expect(plugin.name).toBe("new-deck");
    expect(plugin.version).toBe("0.1.0");
    expect(plugin.license).toBe("MIT");
  });

  it("has skills/new-deck/SKILL.md with correct frontmatter", () => {
    const content = fs.readFileSync(
      path.join(pluginDir, "skills", "new-deck", "SKILL.md"),
      "utf-8",
    );
    expect(content).toContain("name: new-deck");
  });

  it("skill SKILL.md contains slide deck generation instructions", () => {
    const content = fs.readFileSync(
      path.join(pluginDir, "skills", "new-deck", "SKILL.md"),
      "utf-8",
    );
    expect(content).toContain("slide deck");
    expect(content).toContain("SlideEngine");
  });

  it("has all required reference files", () => {
    const refsDir = path.join(pluginDir, "skills", "new-deck", "references");
    for (const ref of [
      "slide-engine.md",
      "slide-types.md",
      "css-core.md",
      "branding.md",
    ]) {
      expect(fs.existsSync(path.join(refsDir, ref))).toBe(true);
    }
  });

  it("has template deck with SlideEngine", () => {
    const content = fs.readFileSync(
      path.join(
        pluginDir,
        "skills",
        "new-deck",
        "templates",
        "slide-deck.html",
      ),
      "utf-8",
    );
    expect(content).toContain("SlideEngine");
    expect(content).toContain('class="deck"');
    expect(
      (content.match(/class="slide /g) || []).length,
    ).toBeGreaterThanOrEqual(5);
  });

  it("has MIT LICENSE", () => {
    const content = fs.readFileSync(path.join(pluginDir, "LICENSE"), "utf-8");
    expect(content).toContain("MIT License");
  });
});
