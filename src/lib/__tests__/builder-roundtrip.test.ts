import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import {
  writeFileSync,
  readFileSync,
  existsSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { parsePresentation } from "../parser";
import { serializePresentation } from "../serializer";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const BUILDER = join(
  REPO_ROOT,
  "new-deck",
  "skills",
  "new-deck",
  "bin",
  "build-deck.mjs",
);

const FRAGMENT = `
<section class="slide slide--title">
  <h1 class="slide__display reveal">Round-Trip</h1>
</section>
<section class="slide slide--content">
  <div class="slide__inner">
    <div class="slide__main">
      <h2 class="slide__heading reveal">Body</h2>
    </div>
  </div>
</section>
<section class="slide slide--quote">
  <div class="slide__content">
    <p class="slide__body reveal">Determinism beats verbosity.</p>
  </div>
</section>
`;

describe("builder output round-trips through editor parser/serializer", () => {
  let workDir: string;
  let slidesPath: string;
  let outPath: string;

  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), "new-deck-roundtrip-"));
    slidesPath = join(workDir, "slides.html");
    outPath = join(workDir, "deck.html");
    writeFileSync(slidesPath, FRAGMENT);
  });

  afterAll(() => {
    if (existsSync(workDir)) rmSync(workDir, { recursive: true, force: true });
  });

  for (const theme of ["midnight", "warm-signal", "terminal", "swiss"]) {
    it(`preserves head, theme tokens, engine, and slides for theme=${theme}`, () => {
      execFileSync(
        process.execPath,
        [
          BUILDER,
          "--theme",
          theme,
          "--slides",
          slidesPath,
          "--title",
          `Round-Trip ${theme}`,
          "--out",
          outPath,
        ],
        { stdio: "pipe" },
      );

      const built = readFileSync(outPath, "utf-8");
      const model = parsePresentation("deck.html", built);

      expect(model.title).toBe(`Round-Trip ${theme}`);
      expect(model.head).toContain("--accent");
      expect(model.head).toContain(".deck {");
      expect(model.scriptBlock).toContain("function SlideEngine()");
      expect(model.scriptBlock).toContain("new SlideEngine()");
      expect(model.slides).toHaveLength(3);
      expect(model.slides.map((s) => s.type)).toEqual([
        "title",
        "content",
        "quote",
      ]);

      const reserialised = serializePresentation(model);
      expect(reserialised).toContain("--accent");
      expect(reserialised).toContain("function SlideEngine()");
      expect(reserialised).toContain('class="slide slide--title"');
      expect(reserialised).toContain('class="slide slide--quote"');

      const normalise = (s: string) => s.replace(/\s+/g, " ").trim();
      const second = parsePresentation("deck.html", reserialised);
      expect(normalise(second.head)).toBe(normalise(model.head));
      expect(normalise(second.scriptBlock)).toBe(normalise(model.scriptBlock));
      expect(second.slides.map((s) => s.type)).toEqual(
        model.slides.map((s) => s.type),
      );
    });
  }

  it("rejects unknown themes via builder hard-fail", () => {
    expect(() =>
      execFileSync(
        process.execPath,
        [
          BUILDER,
          "--theme",
          "no-such-theme",
          "--slides",
          slidesPath,
          "--title",
          "x",
          "--out",
          outPath,
        ],
        { stdio: "pipe" },
      ),
    ).toThrow();
  });
});
