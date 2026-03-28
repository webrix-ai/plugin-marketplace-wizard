import type { MarketplaceSettings } from "./marketplace-schema"

// ---------------------------------------------------------------------------
// Core domain types
// ---------------------------------------------------------------------------

export interface McpServer {
  id: string
  name: string
  sourceApplication: string
  sourceFilePath: string
  scope: "global" | "local"
  config: {
    type?: string
    command?: string
    args?: string[]
    url?: string
    env?: Record<string, string>
    headers?: Record<string, string>
  }
  [key: string]: unknown
}

export interface SkillFile {
  relativePath: string
  content: string
}

export interface Skill {
  id: string
  name: string
  description: string
  sourceApplication: string
  sourceFilePath: string
  scope: "global" | "local"
  content: string
  files?: SkillFile[]
  [key: string]: unknown
}

export interface AgentData {
  id: string
  name: string
  description: string
  sourceFilePath: string
  scope: "global" | "local"
  content: string
  tools?: string
  disallowedTools?: string
  model?: string
  permissionMode?:
    | "default"
    | "acceptEdits"
    | "dontAsk"
    | "bypassPermissions"
    | "plan"
  maxTurns?: number
  memory?: "user" | "project" | "local"
  background?: boolean
  effort?: "low" | "medium" | "high" | "max"
  isolation?: "worktree"
  [key: string]: unknown
}

export interface PluginAuthorData {
  name: string
  email?: string
}

export interface PluginData {
  id: string
  name: string
  slug: string
  description: string
  version: string
  mcps: McpServer[]
  skills: Skill[]
  agents?: AgentData[]
  hooks?: PluginHook[]
  author?: PluginAuthorData
  homepage?: string
  repository?: string
  license?: string
  keywords?: string[]
  category?: string
  tags?: string[]
  strict?: boolean
  sourceOverride?: string | Record<string, unknown>
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------------------

export interface ScanResult {
  mcpServers: McpServer[]
  skills: Skill[]
  agents: AgentData[]
  scannedAt: string
}

// ---------------------------------------------------------------------------
// Drag & drop
// ---------------------------------------------------------------------------

export type DragItemType = "mcp" | "skill" | "agent" | "hook"

export interface DragPayload {
  type: DragItemType
  item: McpServer | Skill | AgentData | PluginHook
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export interface ExportTargets {
  cursor: boolean
  claude: boolean
  github: boolean
  codex: boolean
}

export interface ExportRequest {
  outputDir?: string
  plugins: PluginData[]
  /** @deprecated Prefer `marketplaceSettings` */
  orgName?: string
  marketplaceSettings?: MarketplaceSettings
  exportTargets?: ExportTargets
}

export interface ExportResult {
  success: boolean
  outputDir: string
  pluginCount: number
  files: string[]
  error?: string
}

// ---------------------------------------------------------------------------
// Registry (MCP registry + skills.sh)
// ---------------------------------------------------------------------------

export interface RegistryMcpServer {
  name: string
  description: string
  title?: string
  version: string
  websiteUrl?: string
  repository?: { url: string; source?: string }
  icons?: { src: string; mimeType?: string }[]
  remotes?: { type: string; url: string }[]
  packages?: {
    registryType: string
    identifier: string
    version: string
    transport: { type: string }
  }[]
}

export interface RegistryMcpResult {
  servers: {
    server: RegistryMcpServer
    _meta: Record<string, unknown>
  }[]
  metadata: {
    nextCursor?: string
    count: number
  }
}

export interface RegistrySkillEntry {
  id: string
  skillId: string
  name: string
  installs: number
  source: string
}

export interface RegistrySkillResult {
  query: string
  searchType: string
  skills: RegistrySkillEntry[]
  count: number
}

// ---------------------------------------------------------------------------
// Store-related types (shared across components)
// ---------------------------------------------------------------------------

export interface GitDefaults {
  userName: string | null
  userEmail: string | null
  remoteUrl: string | null
}

export interface CustomRegistry {
  url: string
  name: string
  servers: RegistryMcpServer[]
  total: number
  loading: boolean
  error?: string
}

export interface CustomGitHubSkill {
  name: string
  description: string
  dirName: string
  content: string
  source: string
  repository: string
  files?: SkillFile[]
}

export interface CustomSkillRepo {
  url: string
  owner: string
  repo: string
  skills: CustomGitHubSkill[]
  loading: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export type ClaudeHookEvent =
  | "SessionStart"
  | "InstructionsLoaded"
  | "UserPromptSubmit"
  | "PreToolUse"
  | "PermissionRequest"
  | "PostToolUse"
  | "PostToolUseFailure"
  | "Notification"
  | "SubagentStart"
  | "SubagentStop"
  | "Stop"
  | "StopFailure"
  | "TeammateIdle"
  | "TaskCompleted"
  | "ConfigChange"
  | "WorktreeCreate"
  | "WorktreeRemove"
  | "PreCompact"
  | "PostCompact"
  | "Elicitation"
  | "ElicitationResult"
  | "SessionEnd"

export interface ClaudeCommandHandler {
  type: "command"
  command: string
  timeout?: number
  run_in_background?: boolean
  statusMessage?: string
  once?: boolean
}

export interface ClaudeHttpHandler {
  type: "http"
  url: string
  headers?: Record<string, string>
  allowedEnvVars?: string[]
  timeout?: number
  statusMessage?: string
  once?: boolean
}

export interface ClaudePromptHandler {
  type: "prompt"
  prompt: string
  model?: string
  timeout?: number
  statusMessage?: string
  once?: boolean
}

export interface ClaudeAgentHandler {
  type: "agent"
  prompt: string
  model?: string
  timeout?: number
  statusMessage?: string
  once?: boolean
}

export type ClaudeHookHandler =
  | ClaudeCommandHandler
  | ClaudeHttpHandler
  | ClaudePromptHandler
  | ClaudeAgentHandler

export interface ClaudeHookItem {
  id: string
  event: ClaudeHookEvent
  matcher?: string
  handler: ClaudeHookHandler
  sourceFilePath: string
  scope: "global" | "local"
}

export type CursorHookEvent =
  | "sessionStart"
  | "sessionEnd"
  | "preToolUse"
  | "postToolUse"
  | "postToolUseFailure"
  | "subagentStart"
  | "subagentStop"
  | "beforeShellExecution"
  | "afterShellExecution"
  | "beforeMCPExecution"
  | "afterMCPExecution"
  | "beforeReadFile"
  | "afterFileEdit"
  | "beforeSubmitPrompt"
  | "preCompact"
  | "stop"
  | "afterAgentResponse"
  | "afterAgentThought"
  | "beforeTabFileRead"
  | "afterTabFileEdit"

export interface CursorHookItem {
  id: string
  event: CursorHookEvent
  category: "agent" | "tab"
  type: "command" | "prompt"
  command?: string
  prompt?: string
  model?: string
  matcher?: string
  timeout?: number
  loop_limit?: number
  failClosed?: boolean
  sourceFilePath: string
  scope: "global" | "local"
}

export interface HookScanResult {
  claudeHooks: ClaudeHookItem[]
  cursorHooks: CursorHookItem[]
  scannedAt: string
  claudeEnabled: boolean
  cursorEnabled: boolean
}

// PluginHook — a hook that lives inside a PluginData (draggable, like MCP/Skill/Agent)
export interface PluginHook {
  id: string
  platform: "claude" | "cursor"
  event: string
  handlerType: "command" | "http" | "prompt" | "agent"
  command?: string
  url?: string
  prompt?: string
  model?: string
  matcher?: string
  timeout?: number
  statusMessage?: string
  runInBackground?: boolean
  headers?: Record<string, string>
  allowedEnvVars?: string[]
  cursorCategory?: "agent" | "tab"
  loopLimit?: number
  failClosed?: boolean
  sourceFilePath?: string
  scope?: "global" | "local"
}

export type PluginScalarUpdate = Partial<
  Pick<
    PluginData,
    | "name"
    | "description"
    | "version"
    | "author"
    | "homepage"
    | "repository"
    | "license"
    | "keywords"
    | "category"
    | "tags"
    | "strict"
    | "sourceOverride"
  >
>
