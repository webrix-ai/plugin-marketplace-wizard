import type {
  MarketplaceManifest,
  MarketplacePluginEntry,
  MarketplaceSettings,
} from "./marketplace-schema";
import type { PluginData, McpServer, Skill, AgentData } from "./types";

export interface ValidationIssue {
  path: string;
  message: string;
  severity?: "error" | "warning";
}

export const RESERVED_MARKETPLACE_NAMES = new Set([
  "claude-code-marketplace",
  "claude-code-plugins",
  "claude-plugins-official",
  "anthropic-marketplace",
  "anthropic-plugins",
  "agent-skills",
  "life-sciences",
]);

/** Block obvious impersonation (substring / official-looking slugs) */
const IMPERSONATION_SUBSTRINGS = [
  "anthropic-official",
  "official-claude",
  "official-anthropic",
  "claude-official",
  "anthropic-tools-v",
  "claude-plugins-official",
];

const KEBAB_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidKebabCaseId(value: string): boolean {
  if (!value || value.length > 128) return false;
  return KEBAB_PATTERN.test(value);
}

function looksLikeImpersonation(name: string): boolean {
  const lower = name.toLowerCase();
  if (IMPERSONATION_SUBSTRINGS.some((s) => lower.includes(s))) return true;
  if (/^official[-_]/i.test(lower)) return true;
  return false;
}

const EMAIL_LOOSE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateMarketplaceName(name: string): ValidationIssue | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return { path: "name", message: "Marketplace name is required" };
  }
  if (!isValidKebabCaseId(trimmed)) {
    return {
      path: "name",
      message: "Marketplace name must be kebab-case (lowercase letters, numbers, hyphens only)",
    };
  }
  if (RESERVED_MARKETPLACE_NAMES.has(trimmed)) {
    return { path: "name", message: `"${trimmed}" is reserved for official use` };
  }
  if (looksLikeImpersonation(trimmed)) {
    return {
      path: "name",
      message: "This name appears to impersonate an official marketplace",
    };
  }
  return null;
}

export function validateOwner(owner: MarketplaceSettings["owner"]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!owner.name?.trim()) {
    issues.push({ path: "owner.name", message: "Owner name is required" });
  }
  if (owner.email?.trim() && !EMAIL_LOOSE.test(owner.email.trim())) {
    issues.push({ path: "owner.email", message: "Invalid email format" });
  }
  return issues;
}

export function validatePluginEntry(
  entry: Partial<MarketplacePluginEntry>,
  index: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const pfx = `plugins[${index}]`;
  if (!entry.name?.trim()) {
    issues.push({ path: `${pfx}.name`, message: "Plugin name is required" });
  } else if (!isValidKebabCaseId(entry.name.trim())) {
    issues.push({
      path: `${pfx}.name`,
      message: "Plugin name must be kebab-case",
    });
  }
  if (entry.source === undefined || entry.source === "") {
    issues.push({ path: `${pfx}.source`, message: "Plugin source is required" });
  }
  if (entry.author && !entry.author.name?.trim()) {
    issues.push({ path: `${pfx}.author.name`, message: "Author name is required when author is set" });
  }
  if (entry.author?.email?.trim() && !EMAIL_LOOSE.test(entry.author.email.trim())) {
    issues.push({ path: `${pfx}.author.email`, message: "Invalid author email" });
  }
  return issues;
}

export function validateMarketplaceSettings(settings: MarketplaceSettings): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const n = validateMarketplaceName(settings.name);
  if (n) issues.push(n);
  issues.push(...validateOwner(settings.owner));
  return issues;
}

export function validateMarketplaceManifest(manifest: MarketplaceManifest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  issues.push(...validateMarketplaceSettings({
    name: manifest.name,
    owner: manifest.owner,
    metadata: {
      description: manifest.metadata?.description,
      version: manifest.metadata?.version,
    },
  }));
  manifest.plugins?.forEach((p, i) => {
    issues.push(...validatePluginEntry(p, i));
  });
  return issues;
}

// ---------------------------------------------------------------------------
// MCP server validation
// ---------------------------------------------------------------------------

const VALID_MCP_TYPES = new Set(["stdio", "sse", "streamable-http", "http", ""]);

export function validateMcpServer(mcp: McpServer, pfx = "mcp"): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!mcp.name?.trim()) {
    issues.push({ path: `${pfx}.name`, message: "MCP server name is required" });
  }

  const t = mcp.config?.type ?? "";
  if (t && !VALID_MCP_TYPES.has(t)) {
    issues.push({
      path: `${pfx}.config.type`,
      message: `Unknown transport type "${t}". Expected stdio, sse, or streamable-http`,
    });
  }

  if (!mcp.config) {
    issues.push({ path: `${pfx}.config`, message: "MCP config is missing" });
  } else {
    const isStdio = !t || t === "stdio";
    const isRemote = t === "sse" || t === "streamable-http";

    if (isStdio && !mcp.config.command?.trim()) {
      issues.push({
        path: `${pfx}.config.command`,
        message: "stdio MCP server requires a command",
      });
    }
    if (isRemote && !mcp.config.url?.trim()) {
      issues.push({
        path: `${pfx}.config.url`,
        message: `${t} MCP server requires a url`,
      });
    }
    if (isRemote && mcp.config.url?.trim() && !/^https?:\/\/.+/.test(mcp.config.url.trim())) {
      issues.push({
        path: `${pfx}.config.url`,
        message: "MCP url must start with http:// or https://",
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Skill validation (aligned with the official skill spec)
// ---------------------------------------------------------------------------

const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKILL_NAME_MAX = 64;
const SKILL_DESC_MAX = 1024;

export function validateSkill(skill: Skill, pfx = "skill"): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const name = skill.name?.trim();
  if (!name) {
    issues.push({
      path: `${pfx}.name`,
      message: "Skill name is required",
    });
  } else if (name.length > SKILL_NAME_MAX) {
    issues.push({
      path: `${pfx}.name`,
      message: `Skill name exceeds ${SKILL_NAME_MAX} characters (${name.length}/${SKILL_NAME_MAX})`,
    });
  } else if (name.startsWith("-") || name.endsWith("-")) {
    issues.push({
      path: `${pfx}.name`,
      message: "Skill name must not start or end with a hyphen",
    });
  } else if (!SKILL_NAME_PATTERN.test(name)) {
    issues.push({
      path: `${pfx}.name`,
      message: "Skill name must be lowercase letters, numbers, and hyphens only",
    });
  }

  const desc = skill.description?.trim();
  if (!desc) {
    issues.push({
      path: `${pfx}.description`,
      message: "Description is required so Claude knows when to apply this skill",
    });
  } else if (desc.length > SKILL_DESC_MAX) {
    issues.push({
      path: `${pfx}.description`,
      message: `Description exceeds ${SKILL_DESC_MAX} characters (${desc.length}/${SKILL_DESC_MAX})`,
    });
  }

  if (!skill.content?.trim()) {
    issues.push({
      path: `${pfx}.content`,
      message: "Skill has no content / instructions",
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function skillDirName(skill: Skill): string | null {
  if (skill.sourceFilePath) {
    const parent = skill.sourceFilePath.replace(/\\/g, "/").split("/").slice(-2, -1)[0];
    if (parent && parent !== "skills" && parent !== ".") return parent;
  }
  const m = skill.id?.match(/^loaded:[^:]+:skill:(.+)$/);
  if (m) return m[1];
  return null;
}

export function getSkillDirName(skill: Skill): string | null {
  return skillDirName(skill);
}

// ---------------------------------------------------------------------------
// Agent validation
// ---------------------------------------------------------------------------

const AGENT_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const AGENT_NAME_MAX = 64;
const AGENT_DESC_MAX = 1024;

export function validateAgent(agent: AgentData, pfx = "agent"): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const name = agent.name?.trim();
  if (!name) {
    issues.push({ path: `${pfx}.name`, message: "Agent name is required" });
  } else if (name.length > AGENT_NAME_MAX) {
    issues.push({
      path: `${pfx}.name`,
      message: `Agent name exceeds ${AGENT_NAME_MAX} characters (${name.length}/${AGENT_NAME_MAX})`,
    });
  } else if (name.startsWith("-") || name.endsWith("-")) {
    issues.push({
      path: `${pfx}.name`,
      message: "Agent name must not start or end with a hyphen",
    });
  } else if (!AGENT_NAME_PATTERN.test(name)) {
    issues.push({
      path: `${pfx}.name`,
      message: "Agent name must be lowercase letters, numbers, and hyphens only",
    });
  }

  const desc = agent.description?.trim();
  if (!desc) {
    issues.push({
      path: `${pfx}.description`,
      message: "Description is required so Claude knows when to delegate to this agent",
    });
  } else if (desc.length > AGENT_DESC_MAX) {
    issues.push({
      path: `${pfx}.description`,
      message: `Description exceeds ${AGENT_DESC_MAX} characters (${desc.length}/${AGENT_DESC_MAX})`,
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Full PluginData validation (used by PluginNode)
// ---------------------------------------------------------------------------

export function validatePluginData(plugin: PluginData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!plugin.name?.trim()) {
    issues.push({ path: "name", message: "Plugin name is required" });
  } else if (!isValidKebabCaseId(plugin.name.trim())) {
    issues.push({ path: "name", message: "Plugin name must be kebab-case" });
  }

  if (!plugin.version?.trim()) {
    issues.push({ path: "version", message: "Plugin version is required", severity: "warning" });
  }

  const agents = plugin.agents ?? [];
  if (plugin.mcps.length === 0 && plugin.skills.length === 0 && agents.length === 0) {
    issues.push({
      path: "items",
      message: "Plugin has no MCP servers, skills, or agents",
      severity: "warning",
    });
  }

  plugin.mcps.forEach((mcp, i) => {
    const label = mcp.name?.trim() || `mcps[${i}]`;
    issues.push(...validateMcpServer(mcp, label));
  });

  plugin.skills.forEach((skill, i) => {
    if (skill._loading) return;
    const dir = skillDirName(skill);
    const label = dir || skill.name?.trim() || `skills[${i}]`;
    issues.push(...validateSkill(skill, label));
  });

  agents.forEach((agent, i) => {
    const label = agent.name?.trim() || `agents[${i}]`;
    issues.push(...validateAgent(agent, label));
  });

  return issues;
}
