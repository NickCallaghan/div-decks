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
    expect(plugin.version).toBe("0.2.0");
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
    for (const ref of ["slide-types.md", "branding.md"]) {
      expect(fs.existsSync(path.join(refsDir, ref))).toBe(true);
    }
  });

  it("ships core.css and slide-engine.js as the single source of truth", () => {
    const assetsDir = path.join(pluginDir, "skills", "new-deck", "assets");
    const core = fs.readFileSync(path.join(assetsDir, "core.css"), "utf-8");
    expect(core).toContain(".deck {");
    expect(core).toContain(".slide {");
    const engine = fs.readFileSync(
      path.join(assetsDir, "slide-engine.js"),
      "utf-8",
    );
    expect(engine).toContain("function SlideEngine()");
    expect(engine).toContain("new SlideEngine()");
  });

  it("has base.html template with all injection markers", () => {
    const content = fs.readFileSync(
      path.join(pluginDir, "skills", "new-deck", "templates", "base.html"),
      "utf-8",
    );
    for (const marker of [
      "<!--TITLE-->",
      "<!--THEME-->",
      "<!--CORE-CSS-->",
      "<!--SLIDES-->",
      "<!--SLIDE-ENGINE-->",
    ]) {
      expect(content).toContain(marker);
    }
  });

  it("ships the four built-in themes", () => {
    const themesDir = path.join(pluginDir, "skills", "new-deck", "themes");
    for (const theme of ["midnight", "warm-signal", "terminal", "swiss"]) {
      const css = fs.readFileSync(
        path.join(themesDir, `${theme}.css`),
        "utf-8",
      );
      expect(css).toContain(":root");
      expect(css).toContain("--accent");
      expect(css).toContain("--font-body");
    }
  });

  it("ships the build-deck.mjs builder", () => {
    const builder = fs.readFileSync(
      path.join(pluginDir, "skills", "new-deck", "bin", "build-deck.mjs"),
      "utf-8",
    );
    expect(builder).toContain("#!/usr/bin/env node");
    expect(builder).toContain("--theme");
    expect(builder).toContain("--slides");
    expect(builder).toContain("--out");
  });

  it("has MIT LICENSE", () => {
    const content = fs.readFileSync(path.join(pluginDir, "LICENSE"), "utf-8");
    expect(content).toContain("MIT License");
  });
});
