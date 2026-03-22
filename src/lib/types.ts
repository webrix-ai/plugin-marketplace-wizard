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

export type DragItemType = "mcp" | "skill" | "agent"

export interface DragPayload {
  type: DragItemType
  item: McpServer | Skill | AgentData
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export interface ExportTargets {
  cursor: boolean
  claude: boolean
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
