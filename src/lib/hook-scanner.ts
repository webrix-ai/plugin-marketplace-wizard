import fs from "fs"
import path from "path"
import os from "os"
import type {
  ClaudeHookItem,
  CursorHookItem,
  HookScanResult,
  ClaudeHookEvent,
  CursorHookEvent,
  ClaudeHookHandler,
} from "./types"
import { stripJsonComments } from "./utils"
import { SKIP_DIRS } from "./scanner-config"

const CURSOR_TAB_EVENTS = new Set<string>([
  "beforeTabFileRead",
  "afterTabFileEdit",
])

const SCAN_PROJECT_SUBDIRS = [
  "",
  "Documents",
  "Projects",
  "Developer",
  "repos",
  "src",
  "prjs",
  "projects",
  "work",
]

function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8")
  } catch {
    return null
  }
}

function safeParseJson(content: string): Record<string, unknown> | null {
  try {
    return JSON.parse(stripJsonComments(content)) as Record<string, unknown>
  } catch {
    return null
  }
}

function extractClaudeHooks(
  filePath: string,
  scope: "global" | "local",
): ClaudeHookItem[] {
  const content = safeReadFile(filePath)
  if (!content) return []

  const data = safeParseJson(content)
  if (!data) return []

  const hooksSection = data["hooks"] as Record<string, unknown> | undefined
  if (!hooksSection || typeof hooksSection !== "object") return []

  const items: ClaudeHookItem[] = []

  for (const [event, eventHooks] of Object.entries(hooksSection)) {
    if (event === "disableAllHooks") continue
    if (!Array.isArray(eventHooks)) continue

    for (const group of eventHooks) {
      if (typeof group !== "object" || group === null) continue
      const g = group as Record<string, unknown>
      const matcher =
        typeof g["matcher"] === "string" ? g["matcher"] : undefined
      const handlers = Array.isArray(g["hooks"]) ? g["hooks"] : []

      for (const handler of handlers) {
        if (typeof handler !== "object" || handler === null) continue
        const h = handler as Record<string, unknown>
        const handlerType = String(h["type"] || "command")

        let parsedHandler: ClaudeHookHandler
        if (handlerType === "http") {
          parsedHandler = {
            type: "http",
            url: String(h["url"] || ""),
            headers:
              typeof h["headers"] === "object" && h["headers"] !== null
                ? (h["headers"] as Record<string, string>)
                : undefined,
            allowedEnvVars: Array.isArray(h["allowedEnvVars"])
              ? h["allowedEnvVars"].map(String)
              : undefined,
            timeout:
              typeof h["timeout"] === "number" ? h["timeout"] : undefined,
            statusMessage:
              typeof h["statusMessage"] === "string"
                ? h["statusMessage"]
                : undefined,
          }
        } else if (handlerType === "prompt" || handlerType === "agent") {
          parsedHandler = {
            type: handlerType as "prompt" | "agent",
            prompt: String(h["prompt"] || ""),
            model: typeof h["model"] === "string" ? h["model"] : undefined,
            timeout:
              typeof h["timeout"] === "number" ? h["timeout"] : undefined,
            statusMessage:
              typeof h["statusMessage"] === "string"
                ? h["statusMessage"]
                : undefined,
          }
        } else {
          parsedHandler = {
            type: "command",
            command: String(h["command"] || ""),
            timeout:
              typeof h["timeout"] === "number" ? h["timeout"] : undefined,
            run_in_background:
              typeof h["run_in_background"] === "boolean"
                ? h["run_in_background"]
                : undefined,
            statusMessage:
              typeof h["statusMessage"] === "string"
                ? h["statusMessage"]
                : undefined,
            once: typeof h["once"] === "boolean" ? h["once"] : undefined,
          }
        }

        items.push({
          id: `claude:${scope}:${event}:${filePath}:${items.length}`,
          event: event as ClaudeHookEvent,
          matcher,
          handler: parsedHandler,
          sourceFilePath: filePath,
          scope,
        })
      }
    }
  }

  return items
}

function extractCursorHooks(
  filePath: string,
  scope: "global" | "local",
): CursorHookItem[] {
  const content = safeReadFile(filePath)
  if (!content) return []

  const data = safeParseJson(content)
  if (!data) return []

  const hooksSection = data["hooks"] as Record<string, unknown> | undefined
  if (!hooksSection || typeof hooksSection !== "object") return []

  const items: CursorHookItem[] = []

  for (const [event, hookConfig] of Object.entries(hooksSection)) {
    if (typeof hookConfig !== "object" || hookConfig === null) continue
    const h = hookConfig as Record<string, unknown>

    const hookType = (typeof h["type"] === "string" ? h["type"] : "command") as
      | "command"
      | "prompt"
    const category: "agent" | "tab" = CURSOR_TAB_EVENTS.has(event)
      ? "tab"
      : "agent"

    items.push({
      id: `cursor:${scope}:${event}:${filePath}:${items.length}`,
      event: event as CursorHookEvent,
      category,
      type: hookType,
      command: typeof h["command"] === "string" ? h["command"] : undefined,
      prompt: typeof h["prompt"] === "string" ? h["prompt"] : undefined,
      model: typeof h["model"] === "string" ? h["model"] : undefined,
      matcher: typeof h["matcher"] === "string" ? h["matcher"] : undefined,
      timeout: typeof h["timeout"] === "number" ? h["timeout"] : undefined,
      loop_limit:
        typeof h["loop_limit"] === "number" ? h["loop_limit"] : undefined,
      failClosed:
        typeof h["failClosed"] === "boolean" ? h["failClosed"] : undefined,
      sourceFilePath: filePath,
      scope,
    })
  }

  return items
}

function walkProjectDirs(
  homeDir: string,
  claudeHooks: ClaudeHookItem[],
  cursorHooks: CursorHookItem[],
  seenClaude: Set<string>,
  seenCursor: Set<string>,
): void {
  function walkDir(dirPath: string, depth: number): void {
    if (depth > 3) return

    const localClaudeSettings = path.join(dirPath, ".claude", "settings.json")
    if (
      !seenClaude.has(localClaudeSettings) &&
      fs.existsSync(localClaudeSettings)
    ) {
      seenClaude.add(localClaudeSettings)
      claudeHooks.push(...extractClaudeHooks(localClaudeSettings, "local"))
    }

    const localCursorHooks = path.join(dirPath, ".cursor", "hooks.json")
    if (!seenCursor.has(localCursorHooks) && fs.existsSync(localCursorHooks)) {
      seenCursor.add(localCursorHooks)
      cursorHooks.push(...extractCursorHooks(localCursorHooks, "local"))
    }

    if (depth >= 3) return

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue
        walkDir(path.join(dirPath, entry.name), depth + 1)
      }
    } catch {
      // skip inaccessible
    }
  }

  for (const subdir of SCAN_PROJECT_SUBDIRS) {
    const baseDir = subdir ? path.join(homeDir, subdir) : homeDir
    if (!fs.existsSync(baseDir)) continue
    try {
      const stat = fs.statSync(baseDir)
      if (!stat.isDirectory()) continue
    } catch {
      continue
    }
    walkDir(baseDir, 0)
  }
}

export async function scanHooks(): Promise<HookScanResult> {
  const homeDir = os.homedir()
  const claudeHooks: ClaudeHookItem[] = []
  const cursorHooks: CursorHookItem[] = []
  const seenClaude = new Set<string>()
  const seenCursor = new Set<string>()

  const globalClaudeSettings = path.join(homeDir, ".claude", "settings.json")
  if (fs.existsSync(globalClaudeSettings)) {
    seenClaude.add(globalClaudeSettings)
    claudeHooks.push(...extractClaudeHooks(globalClaudeSettings, "global"))
  }

  const globalCursorHooks = path.join(homeDir, ".cursor", "hooks.json")
  if (fs.existsSync(globalCursorHooks)) {
    seenCursor.add(globalCursorHooks)
    cursorHooks.push(...extractCursorHooks(globalCursorHooks, "global"))
  }

  walkProjectDirs(homeDir, claudeHooks, cursorHooks, seenClaude, seenCursor)

  return {
    claudeHooks,
    cursorHooks,
    scannedAt: new Date().toISOString(),
    claudeEnabled: fs.existsSync(path.join(homeDir, ".claude")),
    cursorEnabled: fs.existsSync(path.join(homeDir, ".cursor")),
  }
}
