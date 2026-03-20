import fs from "fs";
import path from "path";
import os from "os";
import { McpServer, Skill, ScanResult } from "./types";
import { stripJsonComments } from "./utils";
import {
  SKIP_DIRS,
  GLOBAL_MCP_PATHS,
  GLOBAL_SKILL_DIRS,
  LOCAL_MCP_PATTERNS,
  LOCAL_SKILL_PATTERNS,
  PROJECT_SUBDIRS,
} from "./scanner-config";

function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function safeParseJson(content: string): Record<string, unknown> | null {
  try {
    return JSON.parse(stripJsonComments(content));
  } catch {
    return null;
  }
}

function extractMcpServers(
  data: Record<string, unknown>,
  app: string
): Record<string, Record<string, unknown>> {
  if (app === "zed") {
    const servers = data["context_servers"] as Record<string, Record<string, unknown>> | undefined;
    return servers || {};
  }

  const mcpServers = data["mcpServers"] as Record<string, Record<string, unknown>> | undefined;
  if (mcpServers) return mcpServers;

  const mcp = data["mcp"] as Record<string, unknown> | undefined;
  if (mcp?.["servers"]) return mcp["servers"] as Record<string, Record<string, unknown>>;

  const servers = data["servers"] as Record<string, Record<string, unknown>> | undefined;
  if (servers) return servers;

  return {};
}

function normalizeServerConfig(
  name: string,
  config: Record<string, unknown>,
  app: string,
  filePath: string,
  scope: "global" | "local"
): McpServer {
  const serverConfig: McpServer["config"] = {};

  if (config["type"]) serverConfig.type = String(config["type"]);
  if (config["command"]) serverConfig.command = String(config["command"]);
  if (Array.isArray(config["args"]))
    serverConfig.args = config["args"].map(String);
  if (config["url"]) serverConfig.url = String(config["url"]);
  if (config["env"] && typeof config["env"] === "object")
    serverConfig.env = config["env"] as Record<string, string>;
  if (config["headers"] && typeof config["headers"] === "object")
    serverConfig.headers = config["headers"] as Record<string, string>;

  if (!serverConfig.type) {
    if (serverConfig.url) {
      serverConfig.type = serverConfig.url.includes("/sse")
        ? "sse"
        : "streamable-http";
    } else if (serverConfig.command) {
      serverConfig.type = "stdio";
    }
  }

  return {
    id: `${app}:${scope}:${name}:${filePath}`,
    name,
    sourceApplication: app,
    sourceFilePath: filePath,
    scope,
    config: serverConfig,
  };
}

function parseSkillMd(content: string): { name?: string; description?: string; body: string } {
  const result: { name?: string; description?: string; body: string } = { body: content };

  if (content.startsWith("---")) {
    const endIdx = content.indexOf("---", 3);
    if (endIdx !== -1) {
      const frontmatter = content.slice(3, endIdx).trim();
      result.body = content.slice(endIdx + 3).trim();

      for (const line of frontmatter.split("\n")) {
        const colonIdx = line.indexOf(":");
        if (colonIdx === -1) continue;
        const key = line.slice(0, colonIdx).trim().toLowerCase();
        const value = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, "");
        if (key === "name") result.name = value;
        if (key === "description") result.description = value;
      }
    }
  }

  return result;
}

function scanSkillDirectory(
  dirPath: string,
  app: string,
  scope: "global" | "local"
): Skill[] {
  const skills: Skill[] = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

      const skillDir = path.join(dirPath, entry.name);
      const skillMdPath = path.join(skillDir, "SKILL.md");

      if (!fs.existsSync(skillMdPath)) continue;

      const content = safeReadFile(skillMdPath);
      if (!content) continue;

      const parsed = parseSkillMd(content);

      skills.push({
        id: `${app}:${scope}:${entry.name}:${skillMdPath}`,
        name: parsed.name || entry.name,
        description: parsed.description || "",
        sourceApplication: app,
        sourceFilePath: skillMdPath,
        scope,
        content: content.slice(0, 50000),
      });
    }
  } catch {
    // skip inaccessible directories
  }

  return skills;
}

function walkProjectDirs(
  homeDir: string,
  maxDepth: number,
  callback: (dirPath: string) => void
): void {
  for (const subdir of PROJECT_SUBDIRS) {
    const baseDir = subdir ? path.join(homeDir, subdir) : homeDir;
    if (!fs.existsSync(baseDir)) continue;

    try {
      const stat = fs.statSync(baseDir);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }

    walkDir(baseDir, 0, maxDepth, callback);
  }
}

function walkDir(
  dirPath: string,
  currentDepth: number,
  maxDepth: number,
  callback: (dirPath: string) => void
): void {
  if (currentDepth > maxDepth) return;

  callback(dirPath);

  if (currentDepth >= maxDepth) return;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;

      walkDir(path.join(dirPath, entry.name), currentDepth + 1, maxDepth, callback);
    }
  } catch {
    // skip inaccessible directories
  }
}

export async function scanSystem(): Promise<ScanResult> {
  const homeDir = os.homedir();
  const mcpServers: McpServer[] = [];
  const skills: Skill[] = [];
  const seenMcpIds = new Set<string>();
  const seenSkillIds = new Set<string>();

  function addMcp(server: McpServer) {
    if (!seenMcpIds.has(server.id)) {
      seenMcpIds.add(server.id);
      mcpServers.push(server);
    }
  }

  function addSkills(newSkills: Skill[]) {
    for (const skill of newSkills) {
      if (!seenSkillIds.has(skill.id)) {
        seenSkillIds.add(skill.id);
        skills.push(skill);
      }
    }
  }

  for (const def of GLOBAL_MCP_PATHS) {
    const filePath = path.join(homeDir, def.relativePath);
    const content = safeReadFile(filePath);
    if (!content) continue;

    const data = safeParseJson(content);
    if (!data) continue;

    const servers = extractMcpServers(data, def.app);
    for (const [name, config] of Object.entries(servers)) {
      if (typeof config !== "object" || config === null) continue;
      addMcp(
        normalizeServerConfig(
          name,
          config as Record<string, unknown>,
          def.app,
          filePath,
          "global"
        )
      );
    }
  }

  for (const def of GLOBAL_SKILL_DIRS) {
    const dirPath = path.join(homeDir, def.relativePath);
    if (!fs.existsSync(dirPath)) continue;
    addSkills(scanSkillDirectory(dirPath, def.app, "global"));
  }

  walkProjectDirs(homeDir, 3, (dirPath) => {
    for (const pattern of LOCAL_MCP_PATTERNS) {
      const filePath = path.join(dirPath, pattern.pattern);
      const content = safeReadFile(filePath);
      if (!content) continue;

      const data = safeParseJson(content);
      if (!data) continue;

      const servers = extractMcpServers(data, pattern.app);
      for (const [name, config] of Object.entries(servers)) {
        if (typeof config !== "object" || config === null) continue;
        addMcp(
          normalizeServerConfig(
            name,
            config as Record<string, unknown>,
            pattern.app,
            filePath,
            "local"
          )
        );
      }
    }

    for (const pattern of LOCAL_SKILL_PATTERNS) {
      const dirCandidate = path.join(dirPath, pattern.pattern);
      if (!fs.existsSync(dirCandidate)) return;

      try {
        const stat = fs.statSync(dirCandidate);
        if (stat.isDirectory()) {
          addSkills(scanSkillDirectory(dirCandidate, pattern.app, "local"));
        }
      } catch {
        // skip
      }
    }
  });

  return {
    mcpServers,
    skills,
    scannedAt: new Date().toISOString(),
  };
}
