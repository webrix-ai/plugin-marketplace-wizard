import fs from "fs";
import path from "path";
import { PluginData, ExportRequest, ExportResult } from "./types";

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath: string, data: unknown) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function writeText(filePath: string, content: string) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf-8");
}

function buildCursorPluginManifest(plugin: PluginData) {
  return {
    name: plugin.slug,
    displayName: plugin.name,
    version: plugin.version,
    description: plugin.description,
  };
}

function buildClaudePluginManifest(plugin: PluginData) {
  return {
    name: plugin.slug,
    description: plugin.description,
    version: plugin.version,
  };
}

function buildMcpJson(plugin: PluginData) {
  const mcpServers: Record<string, Record<string, unknown>> = {};

  for (const mcp of plugin.mcps) {
    const config: Record<string, unknown> = {};
    if (mcp.config.type) config.type = mcp.config.type;
    if (mcp.config.command) config.command = mcp.config.command;
    if (mcp.config.args?.length) config.args = mcp.config.args;
    if (mcp.config.url) config.url = mcp.config.url;
    if (mcp.config.env && Object.keys(mcp.config.env).length > 0)
      config.env = mcp.config.env;
    if (mcp.config.headers && Object.keys(mcp.config.headers).length > 0)
      config.headers = mcp.config.headers;

    mcpServers[mcp.name] = config;
  }

  return { mcpServers };
}

function buildSkillMd(skill: { name: string; description: string; content: string }) {
  if (skill.content.startsWith("---")) return skill.content;

  const frontmatter = [
    "---",
    `name: ${skill.name}`,
    skill.description ? `description: ${skill.description}` : null,
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  return frontmatter + "\n\n" + skill.content;
}

function writePlugin(outputDir: string, plugin: PluginData): string[] {
  const pluginDir = path.join(outputDir, "plugins", plugin.slug);
  const files: string[] = [];

  const cursorManifest = buildCursorPluginManifest(plugin);
  const cursorPath = path.join(pluginDir, ".cursor-plugin", "plugin.json");
  writeJson(cursorPath, cursorManifest);
  files.push(cursorPath);

  const claudeManifest = buildClaudePluginManifest(plugin);
  const claudePath = path.join(pluginDir, ".claude-plugin", "plugin.json");
  writeJson(claudePath, claudeManifest);
  files.push(claudePath);

  if (plugin.mcps.length > 0) {
    const mcpJson = buildMcpJson(plugin);
    const mcpPath = path.join(pluginDir, ".mcp.json");
    writeJson(mcpPath, mcpJson);
    files.push(mcpPath);
  }

  for (const skill of plugin.skills) {
    const skillSlug = skill.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const skillDir = path.join(pluginDir, "skills", skillSlug);
    const skillPath = path.join(skillDir, "SKILL.md");
    writeText(skillPath, buildSkillMd(skill));
    files.push(skillPath);
  }

  return files;
}

function writeMarketplaceManifests(
  outputDir: string,
  plugins: PluginData[],
  orgName: string
): string[] {
  const files: string[] = [];
  const orgSlug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const cursorMarketplace = {
    name: `${orgSlug}-marketplace`,
    owner: { name: orgName },
    metadata: {
      description: `Plugin marketplace for ${orgName}`,
      version: "1.0.0",
      pluginRoot: "plugins",
    },
    plugins: plugins.map((p) => ({
      name: p.slug,
      source: p.slug,
      description: p.description,
    })),
  };

  const cursorPath = path.join(outputDir, ".cursor-plugin", "marketplace.json");
  writeJson(cursorPath, cursorMarketplace);
  files.push(cursorPath);

  const claudeMarketplace = {
    name: `${orgSlug}-marketplace`,
    owner: { name: orgName },
    metadata: {
      description: `Plugin marketplace for ${orgName}`,
      version: "1.0.0",
      pluginRoot: "./plugins",
    },
    plugins: plugins.map((p) => ({
      name: p.slug,
      source: `./plugins/${p.slug}`,
      description: p.description,
      version: p.version,
    })),
  };

  const claudePath = path.join(outputDir, ".claude-plugin", "marketplace.json");
  writeJson(claudePath, claudeMarketplace);
  files.push(claudePath);

  return files;
}

export async function exportPlugins(request: ExportRequest): Promise<ExportResult> {
  const { outputDir, plugins, orgName = "my-org" } = request;

  try {
    ensureDir(outputDir);
    const allFiles: string[] = [];

    for (const plugin of plugins) {
      const files = writePlugin(outputDir, plugin);
      allFiles.push(...files);
    }

    const manifestFiles = writeMarketplaceManifests(outputDir, plugins, orgName);
    allFiles.push(...manifestFiles);

    return {
      success: true,
      outputDir,
      pluginCount: plugins.length,
      files: allFiles,
    };
  } catch (error) {
    return {
      success: false,
      outputDir,
      pluginCount: 0,
      files: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
