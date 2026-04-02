#!/usr/bin/env node

import path from "node:path";
import fs from "node:fs";
import { exec } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { startServer } from "./start.js";

const COMMAND_TEMPLATE = `---
description: Launch the div.deck presentation editor
---

Start the div.deck slide editor for the presentations in this project.

1. Run \`npx div-deck __DIR__\` in the background
2. Wait a moment for the server to start
3. Open http://localhost:3001 in the browser
4. Tell the user the editor is running and they can access it at http://localhost:3001
`;

function printUsage(): void {
  console.log(`
  div.deck — Browser-based HTML slide deck editor

  Usage:
    div-deck [directory]          Start the editor (default: ./presentations)
    div-deck init                 Interactive setup for your project

  Options:
    --port, -p <number>           Server port (default: 3001)
    --help, -h                    Show this help message
  `);
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  exec(`${cmd} ${url}`);
}

async function prompt(question: string, defaultValue: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${question} (${defaultValue}): `);
  rl.close();
  return answer.trim() || defaultValue;
}

async function runInit(): Promise<void> {
  console.log("\n  div.deck — Project Setup\n");

  const dir = await prompt("  Presentations directory?", "./presentations");

  // Create presentations directory if needed
  const absDir = path.resolve(dir);
  if (!fs.existsSync(absDir)) {
    fs.mkdirSync(absDir, { recursive: true });
    console.log(`  Created ${dir}/`);
  }

  // Add script to package.json
  const pkgPath = path.resolve("package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.deck = `div-deck ${dir}`;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
    console.log(`  Added "deck" script to package.json`);
  }

  // Create Claude Code command
  const commandDir = path.resolve(".claude", "commands");
  const commandPath = path.join(commandDir, "presentations.md");
  if (!fs.existsSync(commandDir)) {
    fs.mkdirSync(commandDir, { recursive: true });
  }
  const commandContent = COMMAND_TEMPLATE.replace("__DIR__", dir);
  fs.writeFileSync(commandPath, commandContent, "utf-8");
  console.log(`  Created .claude/commands/presentations.md`);

  console.log(`
  Setup complete! You can now:
    npm run deck              Start the editor
    /presentations            Use in Claude Code
  `);
}

function parseArgs(args: string[]): {
  command: string;
  dir: string;
  port: number;
} {
  let command = "serve";
  let dir = "./presentations";
  let port = 3001;

  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (arg === "--port" || arg === "-p") {
      port = parseInt(args[++i], 10);
      if (isNaN(port)) {
        console.error("Error: --port requires a number");
        process.exit(1);
      }
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    }
  }

  if (positional[0] === "init") {
    command = "init";
  } else if (positional.length > 0) {
    dir = positional[0];
  }

  return { command, dir, port };
}

async function main(): Promise<void> {
  const { command, dir, port } = parseArgs(process.argv.slice(2));

  if (command === "init") {
    await runInit();
    return;
  }

  const presentationsDir = path.resolve(dir);

  if (!fs.existsSync(presentationsDir)) {
    console.error(`Error: Directory not found: ${presentationsDir}`);
    console.error(
      `Run "div-deck init" to set up your project, or create the directory first.`,
    );
    process.exit(1);
  }

  startServer(presentationsDir, port);

  // Open browser after a short delay for server startup
  setTimeout(() => openBrowser(`http://localhost:${port}`), 500);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
