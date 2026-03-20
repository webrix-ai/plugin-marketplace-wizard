#!/usr/bin/env node

import { execSync, spawnSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve, basename } from "path";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[38;5;102m";
const TEXT = "\x1b[38;5;145m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";

const args = process.argv.slice(2);
const projectName = args[0];

if (!projectName) {
  console.log();
  console.log(`${BOLD}  Create Plugin Marketplace Wizard${RESET}`);
  console.log();
  console.log(`${BOLD}  Usage:${RESET} create-plugin-marketplace-wizard <project-name>`);
  console.log();
  console.log(`${BOLD}  Example:${RESET}`);
  console.log(`    ${DIM}$${RESET} npx create-plugin-marketplace-wizard my-marketplace`);
  console.log();
  process.exit(1);
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

const packageJson = {
  name: slug,
  version: "1.0.0",
  private: true,
  scripts: {
    start: "pmw start",
    validate: "pmw validate",
  },
};

writeFileSync(
  resolve(projectDir, "package.json"),
  JSON.stringify(packageJson, null, 2) + "\n"
);
console.log(`${GREEN}  ✓${RESET} Created package.json`);

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

const initResult = spawnSync("npx", ["pmw", "init"], {
  cwd: projectDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});

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

console.log();
console.log(`${GREEN}${BOLD}  ✓ Marketplace created successfully!${RESET}`);
console.log();
console.log(`${BOLD}  Next steps:${RESET}`);
console.log(`    ${DIM}$${RESET} cd ${TEXT}${projectName}${RESET}`);
console.log(`    ${DIM}$${RESET} ${TEXT}npm start${RESET}  ${DIM}# or: npx pmw start${RESET}`);
console.log();
