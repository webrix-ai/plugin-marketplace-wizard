#!/usr/bin/env node

import { spawn } from "child_process"
import { resolve, join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const cliBin = join(__dirname, "cli.mjs")
const args = ["start", ...process.argv.slice(2)]

const child = spawn(process.execPath, [cliBin, ...args], {
  stdio: "inherit",
  cwd: process.cwd(),
})

child.on("exit", (code) => process.exit(code ?? 0))
process.on("SIGINT", () => child.kill("SIGINT"))
process.on("SIGTERM", () => child.kill("SIGTERM"))
