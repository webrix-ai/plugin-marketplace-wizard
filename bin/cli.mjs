#!/usr/bin/env node

import { spawn, execSync } from "child_process"
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
} from "fs"
import { resolve, join, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PACKAGE_DIR = resolve(__dirname, "..")

const RESET = "\x1b[0m"
const BOLD = "\x1b[1m"
const DIM = "\x1b[38;5;102m"
const TEXT = "\x1b[38;5;145m"
const GREEN = "\x1b[32m"
const RED = "\x1b[31m"
const YELLOW = "\x1b[33m"
const CYAN = "\x1b[36m"

function getVersion() {
  try {
    const pkg = JSON.parse(
      readFileSync(join(PACKAGE_DIR, "package.json"), "utf-8"),
    )
    return pkg.version
  } catch {
    return "0.0.0"
  }
}

const VERSION = getVersion()

function showBanner() {
  console.log()
  console.log(`${BOLD}  Marketplace Wizard${RESET} ${DIM}v${VERSION}${RESET}`)
  console.log(`${DIM}  Build and manage agent plugin marketplaces${RESET}`)
  console.log()
  console.log(`${BOLD}  Usage:${RESET} pmw <command> [options]`)
  console.log()
  console.log(`${BOLD}  Commands:${RESET}`)
  console.log(
    `    ${TEXT}start${RESET}  ${DIM}[dir]${RESET}   Start the visual marketplace editor`,
  )
  console.log(
    `    ${TEXT}test${RESET}   ${DIM}[dir]${RESET}   Validate marketplace files`,
  )
  console.log(
    `    ${TEXT}init${RESET}   ${DIM}[dir]${RESET}   Initialize a new marketplace`,
  )
  console.log()
  console.log(`${BOLD}  Options:${RESET}`)
  console.log(
    `    ${TEXT}--port${RESET}, ${TEXT}-p${RESET}     Port to run the server on ${DIM}(default: 3000)${RESET}`,
  )
  console.log(
    `    ${TEXT}--help${RESET}, ${TEXT}-h${RESET}     Show this help message`,
  )
  console.log(
    `    ${TEXT}--version${RESET}, ${TEXT}-v${RESET}  Show version number`,
  )
  console.log()
  console.log(`${BOLD}  Examples:${RESET}`)
  console.log(`    ${DIM}$${RESET} pmw start`)
  console.log(`    ${DIM}$${RESET} pmw start ./my-marketplace`)
  console.log(`    ${DIM}$${RESET} pmw test`)
  console.log(`    ${DIM}$${RESET} pmw init`)
  console.log()
}

// ---------------------------------------------------------------------------
// init command
// ---------------------------------------------------------------------------

const MARKETPLACE_MANIFEST_TEMPLATE = {
  name: "",
  owner: { name: "" },
  metadata: { description: "", version: "1.0.0" },
  plugins: [],
}

function runInit(targetDir) {
  const dir = resolve(targetDir || ".")
  const dirName = dir.split("/").pop() || "my-marketplace"

  console.log()
  console.log(`${BOLD}  Initializing marketplace in ${CYAN}${dir}${RESET}`)
  console.log()

  mkdirSync(dir, { recursive: true })

  const cursorDir = join(dir, ".cursor-plugin")
  const claudeDir = join(dir, ".claude-plugin")
  const pluginsDir = join(dir, "plugins")
  const cursorManifest = join(cursorDir, "marketplace.json")
  const claudeManifest = join(claudeDir, "marketplace.json")

  if (existsSync(cursorManifest) || existsSync(claudeManifest)) {
    console.log(
      `${YELLOW}  ⚠ Marketplace already initialized in this directory${RESET}`,
    )
    console.log(`${DIM}  Run ${TEXT}pmw start${DIM} to open the editor${RESET}`)
    console.log()
    return
  }

  let ownerName = dirName
  try {
    ownerName =
      execSync("git config user.name", {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() || dirName
  } catch {}

  let ownerEmail
  try {
    ownerEmail =
      execSync("git config user.email", {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() || undefined
  } catch {}

  const slugName = dirName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  const manifest = {
    ...MARKETPLACE_MANIFEST_TEMPLATE,
    name: slugName,
    owner: { name: ownerName, ...(ownerEmail ? { email: ownerEmail } : {}) },
    metadata: {
      description: `Plugin marketplace for ${ownerName}`,
      version: "1.0.0",
    },
  }

  mkdirSync(cursorDir, { recursive: true })
  mkdirSync(claudeDir, { recursive: true })
  mkdirSync(pluginsDir, { recursive: true })

  writeFileSync(cursorManifest, JSON.stringify(manifest, null, 2) + "\n")
  writeFileSync(claudeManifest, JSON.stringify(manifest, null, 2) + "\n")

  console.log(
    `${GREEN}  ✓${RESET} Created ${DIM}.cursor-plugin/marketplace.json${RESET}`,
  )
  console.log(
    `${GREEN}  ✓${RESET} Created ${DIM}.claude-plugin/marketplace.json${RESET}`,
  )
  console.log(`${GREEN}  ✓${RESET} Created ${DIM}plugins/${RESET} directory`)
  console.log()
  console.log(`${BOLD}  Next steps:${RESET}`)
  console.log(
    `    ${DIM}$${RESET} ${TEXT}pmw start${RESET}  ${DIM}Open the visual editor${RESET}`,
  )
  console.log()
}

// ---------------------------------------------------------------------------
// test command (test-runner style validation)
// ---------------------------------------------------------------------------

const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const RESERVED_NAMES = new Set([
  "claude-code-marketplace",
  "claude-code-plugins",
  "claude-plugins-official",
  "anthropic-marketplace",
  "anthropic-plugins",
  "agent-skills",
  "life-sciences",
])

function createValidator(name, fn) {
  return { name, validate: fn }
}

function getValidators() {
  return [
    createValidator("marketplace structure", (dir) => {
      const issues = []
      const hasCursor = existsSync(
        join(dir, ".cursor-plugin", "marketplace.json"),
      )
      const hasClaude = existsSync(
        join(dir, ".claude-plugin", "marketplace.json"),
      )

      if (!hasCursor && !hasClaude) {
        issues.push({
          severity: "error",
          path: dir,
          message:
            "No marketplace manifest found. Run `pmw init` to create one.",
        })
        return issues
      }

      if (!hasCursor)
        issues.push({
          severity: "warning",
          path: ".cursor-plugin/marketplace.json",
          message: "Missing Cursor marketplace manifest",
        })
      if (!hasClaude)
        issues.push({
          severity: "warning",
          path: ".claude-plugin/marketplace.json",
          message: "Missing Claude marketplace manifest",
        })
      if (!existsSync(join(dir, "plugins")))
        issues.push({
          severity: "warning",
          path: "plugins/",
          message: "No plugins directory found",
        })

      return issues
    }),

    createValidator("marketplace manifest", (dir) => {
      const issues = []
      for (const sub of [".cursor-plugin", ".claude-plugin"]) {
        const manifestPath = join(dir, sub, "marketplace.json")
        if (!existsSync(manifestPath)) continue

        let manifest
        try {
          manifest = JSON.parse(readFileSync(manifestPath, "utf-8"))
        } catch (e) {
          issues.push({
            severity: "error",
            path: `${sub}/marketplace.json`,
            message: `Invalid JSON: ${e.message}`,
          })
          continue
        }

        if (!manifest.name) {
          issues.push({
            severity: "error",
            path: `${sub}/marketplace.json`,
            message: "Missing required field: name",
          })
        } else if (!KEBAB_RE.test(manifest.name)) {
          issues.push({
            severity: "error",
            path: `${sub}/marketplace.json`,
            message: "Marketplace name must be kebab-case",
          })
        } else if (RESERVED_NAMES.has(manifest.name)) {
          issues.push({
            severity: "error",
            path: `${sub}/marketplace.json`,
            message: `"${manifest.name}" is reserved for official use`,
          })
        }

        if (!manifest.owner?.name) {
          issues.push({
            severity: "error",
            path: `${sub}/marketplace.json`,
            message: "Missing required field: owner.name",
          })
        }

        if (manifest.owner?.email && !EMAIL_RE.test(manifest.owner.email)) {
          issues.push({
            severity: "warning",
            path: `${sub}/marketplace.json`,
            message: "Invalid owner email format",
          })
        }

        if (!Array.isArray(manifest.plugins)) {
          issues.push({
            severity: "warning",
            path: `${sub}/marketplace.json`,
            message: "Missing or invalid plugins array",
          })
        }
      }
      return issues
    }),

    createValidator("plugin structure", (dir) => {
      const issues = []
      const pluginsDir = join(dir, "plugins")
      if (!existsSync(pluginsDir)) return issues

      let entries
      try {
        entries = readdirSync(pluginsDir, { withFileTypes: true })
      } catch {
        return issues
      }

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith(".")) continue
        const pluginDir = join(pluginsDir, entry.name)

        const hasCursorPlugin = existsSync(
          join(pluginDir, ".cursor-plugin", "plugin.json"),
        )
        const hasClaudePlugin = existsSync(
          join(pluginDir, ".claude-plugin", "plugin.json"),
        )

        if (!hasCursorPlugin && !hasClaudePlugin) {
          issues.push({
            severity: "warning",
            path: `plugins/${entry.name}`,
            message:
              "Missing both .cursor-plugin/plugin.json and .claude-plugin/plugin.json",
          })
        }

        if (!KEBAB_RE.test(entry.name)) {
          issues.push({
            severity: "error",
            path: `plugins/${entry.name}`,
            message: "Plugin directory name must be kebab-case",
          })
        }

        const mcpPath = join(pluginDir, ".mcp.json")
        if (existsSync(mcpPath)) {
          try {
            const mcpJson = JSON.parse(readFileSync(mcpPath, "utf-8"))
            if (!mcpJson.mcpServers || typeof mcpJson.mcpServers !== "object") {
              issues.push({
                severity: "error",
                path: `plugins/${entry.name}/.mcp.json`,
                message: "Missing or invalid mcpServers object",
              })
            }
          } catch (e) {
            issues.push({
              severity: "error",
              path: `plugins/${entry.name}/.mcp.json`,
              message: `Invalid JSON: ${e.message}`,
            })
          }
        }

        const skillsDir = join(pluginDir, "skills")
        if (existsSync(skillsDir)) {
          try {
            const skillEntries = readdirSync(skillsDir, { withFileTypes: true })
            for (const skillEntry of skillEntries) {
              if (!skillEntry.isDirectory()) continue
              if (!existsSync(join(skillsDir, skillEntry.name, "SKILL.md"))) {
                issues.push({
                  severity: "warning",
                  path: `plugins/${entry.name}/skills/${skillEntry.name}`,
                  message: "Skill directory missing SKILL.md",
                })
              }
            }
          } catch {}
        }
      }
      return issues
    }),

    createValidator("plugin manifests", (dir) => {
      const issues = []
      const pluginsDir = join(dir, "plugins")
      if (!existsSync(pluginsDir)) return issues

      let entries
      try {
        entries = readdirSync(pluginsDir, { withFileTypes: true })
      } catch {
        return issues
      }

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith(".")) continue
        const pluginDir = join(pluginsDir, entry.name)

        for (const sub of [".cursor-plugin", ".claude-plugin"]) {
          const manifestPath = join(pluginDir, sub, "plugin.json")
          if (!existsSync(manifestPath)) continue

          try {
            const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"))
            if (!manifest.name?.trim()) {
              issues.push({
                severity: "error",
                path: `plugins/${entry.name}/${sub}/plugin.json`,
                message: "Missing required field: name",
              })
            }
          } catch (e) {
            issues.push({
              severity: "error",
              path: `plugins/${entry.name}/${sub}/plugin.json`,
              message: `Invalid JSON: ${e.message}`,
            })
          }
        }
      }
      return issues
    }),

    createValidator("mcp configurations", (dir) => {
      const issues = []
      const pluginsDir = join(dir, "plugins")
      if (!existsSync(pluginsDir)) return issues

      let entries
      try {
        entries = readdirSync(pluginsDir, { withFileTypes: true })
      } catch {
        return issues
      }

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith(".")) continue
        const mcpPath = join(pluginsDir, entry.name, ".mcp.json")
        if (!existsSync(mcpPath)) continue

        try {
          const mcpJson = JSON.parse(readFileSync(mcpPath, "utf-8"))
          if (!mcpJson.mcpServers) continue

          for (const [name, config] of Object.entries(mcpJson.mcpServers)) {
            const pfx = `plugins/${entry.name}/.mcp.json → ${name}`
            const type = config.type || ""
            const isStdio = !type || type === "stdio"
            const isRemote = type === "sse" || type === "streamable-http"

            if (isStdio && !config.command?.trim()) {
              issues.push({
                severity: "error",
                path: pfx,
                message: "stdio server requires a command",
              })
            }
            if (isRemote && !config.url?.trim()) {
              issues.push({
                severity: "error",
                path: pfx,
                message: `${type} server requires a url`,
              })
            }
          }
        } catch {}
      }
      return issues
    }),

    createValidator("skill files", (dir) => {
      const issues = []
      const pluginsDir = join(dir, "plugins")
      if (!existsSync(pluginsDir)) return issues

      let entries
      try {
        entries = readdirSync(pluginsDir, { withFileTypes: true })
      } catch {
        return issues
      }

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith(".")) continue
        const skillsDir = join(pluginsDir, entry.name, "skills")
        if (!existsSync(skillsDir)) continue

        try {
          const skillEntries = readdirSync(skillsDir, { withFileTypes: true })
          for (const skillEntry of skillEntries) {
            if (!skillEntry.isDirectory()) continue
            const skillMd = join(skillsDir, skillEntry.name, "SKILL.md")
            if (!existsSync(skillMd)) {
              issues.push({
                severity: "warning",
                path: `plugins/${entry.name}/skills/${skillEntry.name}`,
                message: "Missing SKILL.md",
              })
              continue
            }
            const content = readFileSync(skillMd, "utf-8").trim()
            if (!content) {
              issues.push({
                severity: "warning",
                path: `plugins/${entry.name}/skills/${skillEntry.name}/SKILL.md`,
                message: "Skill file is empty",
              })
            }
          }
        } catch {}
      }
      return issues
    }),
  ]
}

function runTest(targetDir) {
  const dir = resolve(targetDir || ".")
  const startTime = Date.now()

  console.log()
  console.log(`${BOLD} PMW ${DIM}v${VERSION}${RESET}`)
  console.log()
  console.log(` ${DIM}${dir}${RESET}`)
  console.log()

  const validators = getValidators()
  let passed = 0
  let failed = 0
  let warned = 0

  for (const validator of validators) {
    const issues = validator.validate(dir)
    const errors = issues.filter((i) => i.severity === "error")
    const warnings = issues.filter((i) => i.severity === "warning")

    if (errors.length > 0) {
      failed++
      console.log(` ${RED}FAIL${RESET} ${validator.name}`)
      for (const issue of errors) {
        console.log(`      ${RED}✕${RESET} ${issue.message}`)
        console.log(`        ${DIM}${issue.path}${RESET}`)
      }
      for (const issue of warnings) {
        console.log(`      ${YELLOW}⚠${RESET} ${issue.message}`)
        console.log(`        ${DIM}${issue.path}${RESET}`)
      }
    } else if (warnings.length > 0) {
      warned++
      console.log(` ${YELLOW}WARN${RESET} ${validator.name}`)
      for (const issue of warnings) {
        console.log(`      ${YELLOW}⚠${RESET} ${issue.message}`)
        console.log(`        ${DIM}${issue.path}${RESET}`)
      }
    } else {
      passed++
      console.log(` ${GREEN}PASS${RESET} ${validator.name}`)
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
  const total = passed + failed + warned

  console.log()
  console.log(
    `${BOLD} Tests:${RESET}  ${failed > 0 ? `${RED}${failed} failed${RESET}, ` : ""}${warned > 0 ? `${YELLOW}${warned} warned${RESET}, ` : ""}${GREEN}${passed} passed${RESET}, ${total} total`,
  )
  console.log(`${BOLD} Time:${RESET}   ${elapsed}s`)
  console.log()

  if (failed > 0) process.exit(1)
}

// ---------------------------------------------------------------------------
// start command
// ---------------------------------------------------------------------------

function runStart(targetDir, port) {
  const dir = resolve(targetDir || ".")

  console.log()
  console.log(`${BOLD}  Marketplace Wizard${RESET} ${DIM}v${VERSION}${RESET}`)
  console.log(`${DIM}  Working directory: ${CYAN}${dir}${RESET}`)
  console.log()

  const env = {
    ...process.env,
    MARKETPLACE_DIR: dir,
    PORT: String(port),
  }

  const nextBin = join(PACKAGE_DIR, "node_modules", ".bin", "next")

  const child = spawn(nextBin, ["dev", "--port", String(port)], {
    cwd: PACKAGE_DIR,
    env,
    stdio: "inherit",
  })

  child.on("error", (err) => {
    console.error(`${RED}  Failed to start: ${err.message}${RESET}`)
    process.exit(1)
  })

  child.on("exit", (code) => {
    process.exit(code ?? 0)
  })

  process.on("SIGINT", () => child.kill("SIGINT"))
  process.on("SIGTERM", () => child.kill("SIGTERM"))
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function parseArgs(args) {
  const result = { command: null, dir: null, port: 3000 }
  let i = 0

  while (i < args.length) {
    const arg = args[i]
    if (arg === "--port" || arg === "-p") {
      result.port = parseInt(args[++i], 10) || 3000
    } else if (arg === "--help" || arg === "-h") {
      result.command = "help"
    } else if (arg === "--version" || arg === "-v") {
      result.command = "version"
    } else if (!result.command) {
      result.command = arg
    } else if (!result.dir) {
      result.dir = arg
    }
    i++
  }

  return result
}

const args = process.argv.slice(2)
const parsed = parseArgs(args)

switch (parsed.command) {
  case "start":
  case "dev":
    runStart(parsed.dir, parsed.port)
    break
  case "init":
    runInit(parsed.dir)
    break
  case "test":
  case "validate":
    runTest(parsed.dir)
    break
  case "version":
    console.log(VERSION)
    break
  case "help":
  case null:
    showBanner()
    break
  default:
    console.log(`${RED}  Unknown command: ${parsed.command}${RESET}`)
    console.log(`${DIM}  Run ${TEXT}pmw --help${DIM} for usage${RESET}`)
    console.log()
    process.exit(1)
}
