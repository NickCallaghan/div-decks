#!/usr/bin/env node
import {
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
  readdirSync,
} from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIR = resolve(fileURLToPath(import.meta.url), "..", "..");
const TEMPLATE = join(SKILL_DIR, "templates", "base.html");
const CORE_CSS = join(SKILL_DIR, "assets", "core.css");
const ENGINE_JS = join(SKILL_DIR, "assets", "slide-engine.js");
const THEMES_DIR = join(SKILL_DIR, "themes");

function availableThemes() {
  return readdirSync(THEMES_DIR)
    .filter((f) => f.endsWith(".css"))
    .map((f) => f.replace(/\.css$/, ""))
    .sort();
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      out[key] = val;
      i++;
    }
  }
  return out;
}

function fail(msg) {
  process.stderr.write(`build-deck: ${msg}\n`);
  process.exit(1);
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const args = parseArgs(process.argv.slice(2));
const theme = args.theme;
const slidesPath = args.slides;
const title = args.title;
const outPath = args.out;

if (!theme) fail("missing --theme");
const themes = availableThemes();
if (!themes.includes(theme))
  fail(`unknown theme '${theme}'. Available: ${themes.join(", ")}`);
if (!slidesPath) fail("missing --slides");
if (!title) fail("missing --title");
if (!outPath) fail("missing --out");

if (!existsSync(slidesPath)) fail(`slides file not found: ${slidesPath}`);
const slides = readFileSync(slidesPath, "utf8").trim();
if (!slides) fail(`slides file is empty: ${slidesPath}`);
if (!/<section\s+class\s*=\s*["'][^"']*\bslide\b/.test(slides))
  fail(`slides file contains no <section class="slide ...">: ${slidesPath}`);

const outDir = dirname(resolve(outPath));
if (!existsSync(outDir) || !statSync(outDir).isDirectory())
  fail(`output directory does not exist: ${outDir}`);

const themeCss = readFileSync(join(THEMES_DIR, `${theme}.css`), "utf8");
const coreCss = readFileSync(CORE_CSS, "utf8");
const engineJs = readFileSync(ENGINE_JS, "utf8");
const template = readFileSync(TEMPLATE, "utf8");

const html = template
  .replace("<!--TITLE-->", escapeHtml(title))
  .replace("<!--THEME-->", themeCss)
  .replace("<!--CORE-CSS-->", coreCss)
  .replace("<!--SLIDES-->", slides)
  .replace("<!--SLIDE-ENGINE-->", engineJs);

writeFileSync(outPath, html);
process.stdout.write(`${resolve(outPath)}\n`);
