import fs from "fs";
import path from "path";
import type { MarketplaceSettings } from "./marketplace-schema";
import { createDefaultMarketplaceSettings } from "./default-marketplace-settings";
import type { PluginData, ExportRequest, ExportResult, ExportTargets } from "./types";

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

function writePlugin(outputDir: string, plugin: PluginData, targets: ExportTargets): string[] {
  const pluginDir = path.join(outputDir, "plugins", plugin.slug);
  const files: string[] = [];

  if (targets.cursor) {
    const cursorManifest = buildCursorPluginManifest(plugin);
    const cursorPath = path.join(pluginDir, ".cursor-plugin", "plugin.json");
    writeJson(cursorPath, cursorManifest);
    files.push(cursorPath);
  }

  if (targets.claude) {
    const claudeManifest = buildClaudePluginManifest(plugin);
    const claudePath = path.join(pluginDir, ".claude-plugin", "plugin.json");
    writeJson(claudePath, claudeManifest);
    files.push(claudePath);
  }

  if (plugin.mcps.length > 0) {
    const mcpJson = buildMcpJson(plugin);
    const mcpPath = path.join(pluginDir, ".mcp.json");
    writeJson(mcpPath, mcpJson);
    files.push(mcpPath);
  }

  const currentSkillDirs = new Set<string>();
  for (const skill of plugin.skills) {
    const skillDirName = extractSkillDirName(skill) ||
      skill.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      skill.id;
    currentSkillDirs.add(skillDirName);
    const skillDir = path.join(pluginDir, "skills", skillDirName);
    const skillPath = path.join(skillDir, "SKILL.md");
    writeText(skillPath, buildSkillMd(skill));
    files.push(skillPath);
  }

  removeStaleSkillDirs(path.join(pluginDir, "skills"), currentSkillDirs);

  return files;
}

function extractSkillDirName(skill: { sourceFilePath?: string; id?: string }): string | null {
  if (skill.sourceFilePath) {
    const parent = path.basename(path.dirname(skill.sourceFilePath));
    if (parent && parent !== "skills" && parent !== ".") return parent;
  }
  const idMatch = skill.id?.match(/^loaded:[^:]+:skill:(.+)$/);
  if (idMatch) return idMatch[1];
  return null;
}

function removeStaleSkillDirs(skillsDir: string, currentDirs: Set<string>) {
  if (!fs.existsSync(skillsDir)) return;
  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      if (!currentDirs.has(entry.name)) {
        fs.rmSync(path.join(skillsDir, entry.name), { recursive: true, force: true });
      }
    }
  } catch {
    // best-effort cleanup
  }
}

function buildMarketplacePluginEntry(
  plugin: PluginData,
  sourceStyle: "cursor" | "claude"
): Record<string, unknown> {
  const defaultSource =
    sourceStyle === "claude" ? `./plugins/${plugin.slug}` : plugin.slug;
  const source =
    plugin.sourceOverride !== undefined ? plugin.sourceOverride : defaultSource;

  const entry: Record<string, unknown> = {
    name: plugin.slug,
    source,
  };
  if (plugin.description) entry.description = plugin.description;
  if (plugin.version) entry.version = plugin.version;
  if (plugin.author?.name) {
    entry.author = {
      name: plugin.author.name,
      ...(plugin.author.email ? { email: plugin.author.email } : {}),
    };
  }
  if (plugin.homepage) entry.homepage = plugin.homepage;
  if (plugin.repository) entry.repository = plugin.repository;
  if (plugin.license) entry.license = plugin.license;
  if (plugin.keywords?.length) entry.keywords = plugin.keywords;
  if (plugin.category) entry.category = plugin.category;
  if (plugin.tags?.length) entry.tags = plugin.tags;
  if (plugin.strict !== undefined) entry.strict = plugin.strict;
  return entry;
}

function writeMarketplaceManifests(
  outputDir: string,
  plugins: PluginData[],
  settings: MarketplaceSettings,
  targets: ExportTargets
): string[] {
  const files: string[] = [];
  const owner: Record<string, unknown> = { name: settings.owner.name };
  if (settings.owner.email) owner.email = settings.owner.email;

  const meta: Record<string, unknown> = {};
  if (settings.metadata.description)
    meta.description = settings.metadata.description;
  if (settings.metadata.version) meta.version = settings.metadata.version;

  if (targets.cursor) {
    const cursorMarketplace = {
      name: settings.name,
      owner,
      ...(Object.keys(meta).length ? { metadata: meta } : {}),
      plugins: plugins.map((p) => buildMarketplacePluginEntry(p, "cursor")),
    };

    const cursorPath = path.join(outputDir, ".cursor-plugin", "marketplace.json");
    writeJson(cursorPath, cursorMarketplace);
    files.push(cursorPath);
  }

  if (targets.claude) {
    const claudeMarketplace = {
      name: settings.name,
      owner,
      ...(Object.keys(meta).length ? { metadata: meta } : {}),
      plugins: plugins.map((p) => buildMarketplacePluginEntry(p, "claude")),
    };

    const claudePath = path.join(outputDir, ".claude-plugin", "marketplace.json");
    writeJson(claudePath, claudeMarketplace);
    files.push(claudePath);
  }

  return files;
}

function removeStalePluginDirs(outputDir: string, currentSlugs: Set<string>) {
  const pluginsDir = path.join(outputDir, "plugins");
  if (!fs.existsSync(pluginsDir)) return;
  try {
    const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      if (!currentSlugs.has(entry.name)) {
        fs.rmSync(path.join(pluginsDir, entry.name), { recursive: true, force: true });
      }
    }
  } catch {
    // best-effort cleanup
  }
}

export async function exportPlugins(request: ExportRequest): Promise<ExportResult> {
  const { plugins, orgName = "my-org", marketplaceSettings, exportTargets } = request;
  const dir = request.outputDir ?? process.cwd();
  const settings =
    marketplaceSettings ?? createDefaultMarketplaceSettings(orgName, undefined);
  const targets: ExportTargets = exportTargets ?? { cursor: true, claude: true };

  try {
    ensureDir(dir);
    const allFiles: string[] = [];

    const currentSlugs = new Set(plugins.map((p) => p.slug));
    removeStalePluginDirs(dir, currentSlugs);

    for (const plugin of plugins) {
      const files = writePlugin(dir, plugin, targets);
      allFiles.push(...files);
    }

    const manifestFiles = writeMarketplaceManifests(dir, plugins, settings, targets);
    allFiles.push(...manifestFiles);

    return {
      success: true,
      outputDir: dir,
      pluginCount: plugins.length,
      files: allFiles,
    };
  } catch (error) {
    return {
      success: false,
      outputDir: dir,
      pluginCount: 0,
      files: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
