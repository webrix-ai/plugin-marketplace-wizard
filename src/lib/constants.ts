export const MAX_UNDO_HISTORY = 50;

export const STORAGE_KEYS = {
  autoSave: "pmw:autoSave",
  customRegistries: "pmw:customRegistries",
  exportTargets: "pmw:exportTargets",
} as const;

export const DEFAULTS = {
  pluginVersion: "1.0.0",
} as const;

export const REGISTRY_URLS = {
  mcpRegistry: "https://registry.modelcontextprotocol.io",
  skillsSh: "https://skills.sh",
} as const;
