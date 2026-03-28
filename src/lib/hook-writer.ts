import fs from "fs"
import path from "path"
import os from "os"
import type { ClaudeHookItem, CursorHookItem, ClaudeHookHandler } from "./types"
import { stripJsonComments } from "./utils"

function safeReadJson(filePath: string): Record<string, unknown> {
  try {
    const content = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(stripJsonComments(content)) as Record<string, unknown>
  } catch {
    return {}
  }
}

function writeJson(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8")
}

function buildHandlerObj(handler: ClaudeHookHandler): Record<string, unknown> {
  const obj: Record<string, unknown> = { type: handler.type }
  if (handler.type === "command") {
    obj["command"] = handler.command
    if (handler.timeout !== undefined) obj["timeout"] = handler.timeout
    if (handler.run_in_background !== undefined)
      obj["run_in_background"] = handler.run_in_background
    if (handler.statusMessage !== undefined)
      obj["statusMessage"] = handler.statusMessage
    if (handler.once !== undefined) obj["once"] = handler.once
  } else if (handler.type === "http") {
    obj["url"] = handler.url
    if (handler.headers) obj["headers"] = handler.headers
    if (handler.allowedEnvVars) obj["allowedEnvVars"] = handler.allowedEnvVars
    if (handler.timeout !== undefined) obj["timeout"] = handler.timeout
    if (handler.statusMessage !== undefined)
      obj["statusMessage"] = handler.statusMessage
  } else if (handler.type === "prompt" || handler.type === "agent") {
    obj["prompt"] = handler.prompt
    if (handler.model) obj["model"] = handler.model
    if (handler.timeout !== undefined) obj["timeout"] = handler.timeout
    if (handler.statusMessage !== undefined)
      obj["statusMessage"] = handler.statusMessage
  }
  return obj
}

function handlerFingerprint(h: Record<string, unknown>): string {
  return `${h["type"] || ""}:${h["command"] || ""}:${h["url"] || ""}:${h["prompt"] || ""}`
}

export function getDefaultClaudeHookPath(scope: "global" | "local"): string {
  if (scope === "global") {
    return path.join(os.homedir(), ".claude", "settings.json")
  }
  return path.join(process.cwd(), ".claude", "settings.json")
}

export function getDefaultCursorHookPath(scope: "global" | "local"): string {
  if (scope === "global") {
    return path.join(os.homedir(), ".cursor", "hooks.json")
  }
  return path.join(process.cwd(), ".cursor", "hooks.json")
}

export function addClaudeHook(
  item: Omit<ClaudeHookItem, "id">,
  filePath: string,
): void {
  const data = safeReadJson(filePath)
  const hooks = (data["hooks"] as Record<string, unknown[]>) || {}
  const eventKey = item.event

  const existing = Array.isArray(hooks[eventKey]) ? [...hooks[eventKey]] : []
  const newGroup: Record<string, unknown> = {}
  if (item.matcher) newGroup["matcher"] = item.matcher
  newGroup["hooks"] = [buildHandlerObj(item.handler)]

  hooks[eventKey] = [...existing, newGroup]
  data["hooks"] = hooks
  writeJson(filePath, data)
}

export function updateClaudeHook(
  item: ClaudeHookItem,
  updates: Partial<ClaudeHookItem>,
): void {
  deleteClaudeHook(item)
  const merged = { ...item, ...updates }
  addClaudeHook(merged, merged.sourceFilePath)
}

export function deleteClaudeHook(item: ClaudeHookItem): void {
  const data = safeReadJson(item.sourceFilePath)
  const hooks = (data["hooks"] as Record<string, unknown[]>) || {}
  const eventKey = item.event

  if (!Array.isArray(hooks[eventKey])) return

  const targetFp = handlerFingerprint(buildHandlerObj(item.handler))
  const newGroups = (hooks[eventKey] as Record<string, unknown>[]).reduce(
    (acc: Record<string, unknown>[], group) => {
      const groupHooks = Array.isArray(group["hooks"])
        ? (group["hooks"] as Record<string, unknown>[])
        : []
      const filtered = groupHooks.filter(
        (h) => handlerFingerprint(h) !== targetFp,
      )
      if (filtered.length === 0) return acc
      return [...acc, { ...group, hooks: filtered }]
    },
    [],
  )

  if (newGroups.length === 0) {
    delete hooks[eventKey]
  } else {
    hooks[eventKey] = newGroups
  }
  data["hooks"] = hooks
  writeJson(item.sourceFilePath, data)
}

export function addCursorHook(
  item: Omit<CursorHookItem, "id">,
  filePath: string,
): void {
  const data = safeReadJson(filePath)
  if (!data["version"]) data["version"] = 1
  const hooks = (data["hooks"] as Record<string, unknown>) || {}

  const hookObj = buildCursorHookObj(item)
  hooks[item.event] = hookObj
  data["hooks"] = hooks
  writeJson(filePath, data)
}

export function updateCursorHook(
  item: CursorHookItem,
  updates: Partial<CursorHookItem>,
): void {
  const merged = { ...item, ...updates }
  const data = safeReadJson(merged.sourceFilePath)
  if (!data["version"]) data["version"] = 1
  const hooks = (data["hooks"] as Record<string, unknown>) || {}

  // Remove old event key if event name changed
  if (updates.event && updates.event !== item.event) {
    delete hooks[item.event]
  }

  hooks[merged.event] = buildCursorHookObj(merged)
  data["hooks"] = hooks
  writeJson(merged.sourceFilePath, data)
}

export function deleteCursorHook(item: CursorHookItem): void {
  const data = safeReadJson(item.sourceFilePath)
  const hooks = (data["hooks"] as Record<string, unknown>) || {}
  delete hooks[item.event]
  data["hooks"] = hooks
  writeJson(item.sourceFilePath, data)
}

function buildCursorHookObj(
  item: Omit<CursorHookItem, "id">,
): Record<string, unknown> {
  const obj: Record<string, unknown> = { type: item.type }
  if (item.type === "command" && item.command) obj["command"] = item.command
  if (item.type === "prompt" && item.prompt) obj["prompt"] = item.prompt
  if (item.model) obj["model"] = item.model
  if (item.matcher) obj["matcher"] = item.matcher
  if (item.timeout !== undefined) obj["timeout"] = item.timeout
  if (item.loop_limit !== undefined) obj["loop_limit"] = item.loop_limit
  if (item.failClosed !== undefined) obj["failClosed"] = item.failClosed
  return obj
}
