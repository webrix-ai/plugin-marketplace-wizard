import type {
  McpServer,
  Skill,
  SkillFile,
  RegistryMcpServer,
  RegistrySkillEntry,
  CustomRegistry,
} from "../types";
import { STORAGE_KEYS, REGISTRY_URLS } from "../constants";

export function registryMcpToLocal(server: RegistryMcpServer): McpServer {
  const config: McpServer["config"] = {};
  if (server.remotes?.[0]) {
    config.type =
      server.remotes[0].type === "streamable-http"
        ? "streamable-http"
        : server.remotes[0].type;
    config.url = server.remotes[0].url;
  } else if (server.packages?.[0]) {
    config.type = server.packages[0].transport?.type || "stdio";
    config.command = "npx";
    config.args = ["-y", server.packages[0].identifier];
  }

  return {
    id: `registry:${server.name}:${server.version}`,
    name: server.name,
    sourceApplication: "registry",
    sourceFilePath: server.websiteUrl || REGISTRY_URLS.mcpRegistry,
    scope: "global",
    config,
  };
}

export function registrySkillToLocal(
  entry: RegistrySkillEntry,
  fullContent?: string,
  files?: SkillFile[]
): Skill {
  const description = fullContent
    ? extractFrontmatter(fullContent, "description") || `From ${entry.source}`
    : `From ${entry.source} (${entry.installs.toLocaleString()} installs)`;

  return {
    id: `skills.sh:${entry.id}`,
    name: entry.name,
    description,
    sourceApplication: "skills.sh",
    sourceFilePath: entry.source
      ? `https://github.com/${entry.source}`
      : REGISTRY_URLS.skillsSh,
    scope: "global",
    content:
      fullContent ||
      `# ${entry.name}\n\nInstall from: ${entry.source}\nSkill ID: ${entry.skillId}\n`,
    files: files?.length ? files : undefined,
  };
}

function extractFrontmatter(content: string, field: string): string | null {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  const re = new RegExp(`^${field}:\\s*["']?(.+?)["']?\\s*$`, "m");
  const match = fmMatch[1].match(re);
  return match?.[1] || null;
}

export function persistCustomRegistryUrls(registries: CustomRegistry[]) {
  try {
    localStorage.setItem(
      STORAGE_KEYS.customRegistries,
      JSON.stringify(registries.map((r) => r.url))
    );
  } catch {
    /* localStorage not available */
  }
}
