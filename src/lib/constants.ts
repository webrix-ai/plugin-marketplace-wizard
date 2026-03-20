export const MAX_UNDO_HISTORY = 50;

export const STORAGE_KEYS = {
  autoSave: "marketplace-wizard:autoSave",
  customRegistries: "marketplace-wizard:customRegistries",
} as const;

export const DEFAULTS = {
  outputDir: "./marketplace-output",
  pluginVersion: "1.0.0",
} as const;

export const REGISTRY_URLS = {
  mcpRegistry: "https://registry.modelcontextprotocol.io",
  skillsSh: "https://skills.sh",
} as const;
