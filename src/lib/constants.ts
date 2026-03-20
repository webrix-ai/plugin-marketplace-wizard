export const MAX_UNDO_HISTORY = 50;

/** How long (ms) to suppress incoming SSE updates after the wizard writes to disk. */
export const WRITE_GUARD_MS = 12_000;

/** Server-side file-watcher debounce (ms). */
export const WATCHER_DEBOUNCE_MS = 10_000;

export const STORAGE_KEYS = {
  autoSave: "pmw:autoSave",
  customRegistries: "pmw:customRegistries",
  customSkillRepos: "pmw:customSkillRepos",
  exportTargets: "pmw:exportTargets",
} as const;

export const DEFAULTS = {
  pluginVersion: "1.0.0",
} as const;

export const REGISTRY_URLS = {
  mcpRegistry: "https://registry.modelcontextprotocol.io",
  skillsSh: "https://skills.sh",
} as const;
