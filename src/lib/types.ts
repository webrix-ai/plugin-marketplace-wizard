export interface McpServer {
  id: string;
  name: string;
  sourceApplication: string;
  sourceFilePath: string;
  scope: "global" | "local";
  config: {
    type?: string;
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
    headers?: Record<string, string>;
  };
  [key: string]: unknown;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  sourceApplication: string;
  sourceFilePath: string;
  scope: "global" | "local";
  content: string;
  [key: string]: unknown;
}

export interface PluginData {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  mcps: McpServer[];
  skills: Skill[];
  [key: string]: unknown;
}

export interface ScanResult {
  mcpServers: McpServer[];
  skills: Skill[];
  scannedAt: string;
}

export type DragItemType = "mcp" | "skill";

export interface DragPayload {
  type: DragItemType;
  item: McpServer | Skill;
}

export interface ExportRequest {
  outputDir: string;
  plugins: PluginData[];
  orgName?: string;
}

export interface ExportResult {
  success: boolean;
  outputDir: string;
  pluginCount: number;
  files: string[];
  error?: string;
}

// --- Registry types ---

export interface RegistryMcpServer {
  name: string;
  description: string;
  title?: string;
  version: string;
  websiteUrl?: string;
  repository?: { url: string; source?: string };
  icons?: { src: string; mimeType?: string }[];
  remotes?: { type: string; url: string }[];
  packages?: {
    registryType: string;
    identifier: string;
    version: string;
    transport: { type: string };
  }[];
}

export interface RegistryMcpResult {
  servers: {
    server: RegistryMcpServer;
    _meta: Record<string, unknown>;
  }[];
  metadata: {
    nextCursor?: string;
    count: number;
  };
}

export interface RegistrySkillResult {
  query: string;
  searchType: string;
  skills: {
    id: string;
    skillId: string;
    name: string;
    installs: number;
    source: string;
  }[];
  count: number;
}
