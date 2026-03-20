import fs from "fs";
import path from "path";
import type { PluginData, McpServer, Skill } from "./types";
import { stripJsonComments } from "./utils";

export function safeReadJson(filePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(stripJsonComments(raw));
  } catch {
    return null;
  }
}

export function safeReadText(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function parseSkillFrontmatter(content: string): {
  name?: string;
  description?: string;
} {
  if (!content.startsWith("---")) return {};
  const endIdx = content.indexOf("---", 3);
  if (endIdx === -1) return {};
  const fm = content.slice(3, endIdx).trim();
  const result: Record<string, string> = {};
  for (const line of fm.split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    result[line.slice(0, i).trim().toLowerCase()] = line
      .slice(i + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }
  return result;
}

export function readPluginDir(
  pluginDir: string,
  slug: string
): PluginData | null {
  let name = slug;
  let description = "";
  let version = "1.0.0";

  const cursorManifest = safeReadJson(
    path.join(pluginDir, ".cursor-plugin", "plugin.json")
  );
  if (cursorManifest) {
    name =
      (cursorManifest.displayName as string) ||
      (cursorManifest.name as string) ||
      slug;
    description = (cursorManifest.description as string) || "";
    version = (cursorManifest.version as string) || "1.0.0";
  } else {
    const claudeManifest = safeReadJson(
      path.join(pluginDir, ".claude-plugin", "plugin.json")
    );
    if (claudeManifest) {
      name = (claudeManifest.name as string) || slug;
      description = (claudeManifest.description as string) || "";
      version = (claudeManifest.version as string) || "1.0.0";
    }
  }

  const mcps: McpServer[] = [];
  const mcpJson = safeReadJson(path.join(pluginDir, ".mcp.json"));
  if (mcpJson) {
    const servers = (mcpJson.mcpServers || {}) as Record<
      string,
      Record<string, unknown>
    >;
    for (const [mcpName, config] of Object.entries(servers)) {
      mcps.push({
        id: `loaded:${slug}:${mcpName}`,
        name: mcpName,
        sourceApplication: "marketplace",
        sourceFilePath: path.join(pluginDir, ".mcp.json"),
        scope: "global",
        config: {
          type: config.type as string | undefined,
          command: config.command as string | undefined,
          args: config.args as string[] | undefined,
          url: config.url as string | undefined,
          env: config.env as Record<string, string> | undefined,
          headers: config.headers as Record<string, string> | undefined,
        },
      });
    }
  }

  const skills: Skill[] = [];
  const skillsDir = path.join(pluginDir, "skills");
  if (fs.existsSync(skillsDir)) {
    try {
      const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const skillMd = safeReadText(
          path.join(skillsDir, entry.name, "SKILL.md")
        );
        if (!skillMd) continue;
        const fm = parseSkillFrontmatter(skillMd);
        skills.push({
          id: `loaded:${slug}:skill:${entry.name}`,
          name: fm.name || entry.name,
          description: fm.description || "",
          sourceApplication: "marketplace",
          sourceFilePath: path.join(skillsDir, entry.name, "SKILL.md"),
          scope: "global",
          content: skillMd,
        });
      }
    } catch {
      // skip
    }
  }

  return {
    id: `loaded:${slug}`,
    name,
    slug,
    description,
    version,
    mcps,
    skills,
  };
}

export function readAllPlugins(outputDir: string): PluginData[] {
  const pluginsDir = path.join(outputDir, "plugins");
  if (!fs.existsSync(pluginsDir)) return [];

  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
  const plugins: PluginData[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const plugin = readPluginDir(
      path.join(pluginsDir, entry.name),
      entry.name
    );
    if (plugin) plugins.push(plugin);
  }

  return plugins;
}
