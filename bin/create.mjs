#!/usr/bin/env node

import { execSync, spawnSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { resolve, basename } from "path";
import { createInterface } from "readline";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[38;5;102m";
const TEXT = "\x1b[38;5;145m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

let projectName = process.argv[2];

if (!projectName) {
  console.log();
  console.log(`${BOLD}  Create Plugin Marketplace Wizard${RESET}`);
  console.log();
  projectName = await prompt(`  ${TEXT}What is your marketplace name?${RESET} `);

  if (!projectName) {
    console.log(`${RED}  ✗ A project name is required${RESET}`);
    console.log();
    process.exit(1);
  }
}

const projectDir = resolve(projectName);

if (existsSync(projectDir)) {
  console.log();
  console.log(`${RED}  ✗ Directory ${CYAN}${projectName}${RED} already exists${RESET}`);
  console.log();
  process.exit(1);
}

console.log();
console.log(`${BOLD}  Creating marketplace in ${CYAN}${projectDir}${RESET}`);
console.log();

mkdirSync(projectDir, { recursive: true });

const slug = basename(projectDir).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// -------------------------------------------------------------------------
// package.json
// -------------------------------------------------------------------------

const packageJson = {
  name: slug,
  version: "1.0.0",
  private: true,
  scripts: {
    start: "pmw start",
    test: "pmw test",
  },
};

writeFileSync(
  resolve(projectDir, "package.json"),
  JSON.stringify(packageJson, null, 2) + "\n"
);
console.log(`${GREEN}  ✓${RESET} Created package.json`);

// -------------------------------------------------------------------------
// Install plugin-marketplace-wizard
// -------------------------------------------------------------------------

const npmInstall = spawnSync("npm", ["install", "plugin-marketplace-wizard"], {
  cwd: projectDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (npmInstall.status !== 0) {
  console.log(`${RED}  ✗ Failed to install plugin-marketplace-wizard${RESET}`);
  process.exit(1);
}
console.log(`${GREEN}  ✓${RESET} Installed plugin-marketplace-wizard`);

// -------------------------------------------------------------------------
// Initialize marketplace manifests
// -------------------------------------------------------------------------

const initResult = spawnSync("npx", ["pmw", "init"], {
  cwd: projectDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});

// -------------------------------------------------------------------------
// Create example plugin with a skill
// -------------------------------------------------------------------------

let ownerName = slug;
try {
  ownerName = execSync("git config user.name", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim() || slug;
} catch {}

const pluginSlug = "hello-world";
const pluginDir = resolve(projectDir, "plugins", pluginSlug);

mkdirSync(resolve(pluginDir, ".cursor-plugin"), { recursive: true });
mkdirSync(resolve(pluginDir, ".claude-plugin"), { recursive: true });
mkdirSync(resolve(pluginDir, "skills", "getting-started"), { recursive: true });

writeFileSync(
  resolve(pluginDir, ".cursor-plugin", "plugin.json"),
  JSON.stringify({
    name: pluginSlug,
    displayName: "Hello World",
    version: "1.0.0",
    description: "An example plugin to get you started",
  }, null, 2) + "\n"
);

writeFileSync(
  resolve(pluginDir, ".claude-plugin", "plugin.json"),
  JSON.stringify({
    name: pluginSlug,
    description: "An example plugin to get you started",
    version: "1.0.0",
  }, null, 2) + "\n"
);

writeFileSync(
  resolve(pluginDir, "skills", "getting-started", "SKILL.md"),
  `---
name: getting-started
description: A starter skill that greets users and explains how to use this marketplace
---

# Getting Started

You are a helpful assistant that knows about the ${slug} plugin marketplace.

## When to use this skill

Use this skill when the user:

- Asks for help getting started
- Wants to know what plugins are available
- Needs guidance on how to use the marketplace

## Instructions

1. Greet the user warmly
2. Explain that this is the **${slug}** marketplace
3. List the available plugins and what they do
4. Offer to help with any specific task

## Example response

> Welcome! This marketplace provides curated plugins for your AI coding assistant.
> Let me know what you'd like help with and I'll find the right tool for you.
`
);

// Update marketplace manifests with the example plugin
for (const sub of [".cursor-plugin", ".claude-plugin"]) {
  const manifestPath = resolve(projectDir, sub, "marketplace.json");
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      manifest.plugins = [
        {
          name: pluginSlug,
          source: sub === ".claude-plugin" ? `./plugins/${pluginSlug}` : pluginSlug,
          description: "An example plugin to get you started",
          version: "1.0.0",
        },
      ];
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    } catch {}
  }
}

console.log(`${GREEN}  ✓${RESET} Created example plugin ${DIM}plugins/${pluginSlug}${RESET}`);

// -------------------------------------------------------------------------
// Git init
// -------------------------------------------------------------------------

try {
  execSync("git init", { cwd: projectDir, stdio: "ignore" });

  const gitignore = `node_modules/\n.next/\n`;
  writeFileSync(resolve(projectDir, ".gitignore"), gitignore);

  execSync("git add -A", { cwd: projectDir, stdio: "ignore" });
  execSync('git commit -m "Initial marketplace setup"', { cwd: projectDir, stdio: "ignore" });

  console.log(`${GREEN}  ✓${RESET} Initialized git repository`);
} catch {
  console.log(`${DIM}  Skipped git init${RESET}`);
}

// -------------------------------------------------------------------------
// Done
// -------------------------------------------------------------------------

console.log();
console.log(`${GREEN}${BOLD}  ✓ Marketplace created successfully!${RESET}`);
console.log();
console.log(`${BOLD}  Next steps:${RESET}`);
console.log(`    ${DIM}$${RESET} cd ${TEXT}${projectName}${RESET}`);
console.log(`    ${DIM}$${RESET} ${TEXT}npm start${RESET}`);
console.log();
console.log(`  ${DIM}Run ${TEXT}npm test${DIM} to validate your marketplace${RESET}`);
console.log();
