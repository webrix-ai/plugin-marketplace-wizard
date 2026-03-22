export const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "target",
  ".cargo",
  "Pods",
  ".gradle",
  ".idea",
  ".terraform",
  "Library",
  ".Trash",
  "Applications",
  "Music",
  "Movies",
  "Pictures",
  "Downloads",
  ".cache",
  ".npm",
  ".nvm",
  ".rustup",
  ".local",
  ".docker",
])

interface McpPathDef {
  app: string
  relativePath: string
}

interface SkillDirDef {
  app: string
  relativePath: string
}

export const GLOBAL_MCP_PATHS: McpPathDef[] = [
  {
    app: "claude",
    relativePath:
      "Library/Application Support/Claude/claude_desktop_config.json",
  },
  { app: "cursor", relativePath: ".cursor/mcp.json" },
  {
    app: "vscode",
    relativePath: "Library/Application Support/Code/User/settings.json",
  },
  {
    app: "vscode",
    relativePath: "Library/Application Support/Code/User/mcp.json",
  },
  {
    app: "vscode-insiders",
    relativePath:
      "Library/Application Support/Code - Insiders/User/settings.json",
  },
  {
    app: "cline",
    relativePath:
      "Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
  },
  {
    app: "roo",
    relativePath:
      "Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json",
  },
  { app: "windsurf", relativePath: ".codeium/windsurf/mcp_config.json" },
  { app: "zed", relativePath: ".config/zed/settings.json" },
  { app: "gemini", relativePath: ".gemini/settings.json" },
]

interface AgentDirDef {
  app: string
  relativePath: string
}

export const GLOBAL_AGENT_DIRS: AgentDirDef[] = [
  { app: "claude", relativePath: ".claude/agents" },
  { app: "cursor", relativePath: ".cursor/agents" },
  { app: "codex", relativePath: ".codex/agents" },
]

export const LOCAL_AGENT_PATTERNS = [
  { app: "claude", pattern: ".claude/agents" },
  { app: "cursor", pattern: ".cursor/agents" },
]

export const GLOBAL_SKILL_DIRS: SkillDirDef[] = [
  { app: "cursor", relativePath: ".cursor/skills" },
  { app: "cursor", relativePath: ".cursor/skills-cursor" },
  { app: "claude", relativePath: ".claude/skills" },
  { app: "codex", relativePath: ".codex/skills" },
  { app: "cline", relativePath: ".cline/skills" },
  { app: "windsurf", relativePath: ".codeium/windsurf/skills" },
  { app: "global", relativePath: ".agents/skills" },
]

export const LOCAL_MCP_PATTERNS = [
  { app: "cursor", pattern: ".cursor/mcp.json" },
  { app: "claude_code", pattern: ".mcp.json" },
  { app: "vscode", pattern: ".vscode/mcp.json" },
  { app: "windsurf", pattern: ".codeium/windsurf/mcp_config.json" },
  { app: "zed", pattern: ".zed/settings.json" },
  { app: "gemini", pattern: ".gemini/settings.json" },
  { app: "junie", pattern: ".junie/mcp/mcp.json" },
]

export const LOCAL_SKILL_PATTERNS = [
  { app: "cursor", pattern: ".cursor/skills" },
  { app: "claude", pattern: ".claude/skills" },
  { app: "codex", pattern: ".codex/skills" },
  { app: "cline", pattern: ".cline/skills" },
]

export const PROJECT_SUBDIRS = [
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
