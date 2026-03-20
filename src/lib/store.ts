"use client";

import { create } from "zustand";
import type { MarketplaceSettings } from "./marketplace-schema";
import type {
  McpServer,
  Skill,
  PluginData,
  ExportResult,
  RegistryMcpServer,
} from "./types";
import { createDefaultMarketplaceSettings } from "./default-marketplace-settings";
import {
  mergePluginsWithManifest,
  settingsFromManifest,
} from "./merge-marketplace-manifest";
import type { MarketplaceManifest } from "./marketplace-schema";
import { slugify } from "./utils";
import { authorFromGit } from "./git-defaults";

interface RegistrySkillEntry {
  id: string;
  skillId: string;
  name: string;
  installs: number;
  source: string;
}

export interface GitDefaults {
  userName: string | null;
  userEmail: string | null;
  remoteUrl: string | null;
}

type PluginScalarUpdate = Partial<
  Pick<
    PluginData,
    | "name"
    | "description"
    | "version"
    | "author"
    | "homepage"
    | "repository"
    | "license"
    | "keywords"
    | "category"
    | "tags"
    | "strict"
    | "sourceOverride"
  >
>;

const MAX_HISTORY = 50;

interface WizardState {
  mcpServers: McpServer[];
  skills: Skill[];
  plugins: PluginData[];
  outputDir: string;
  marketplaceSettings: MarketplaceSettings;
  gitDefaults: GitDefaults | null;
  categories: string[];
  selectedPluginId: string | null;
  searchQuery: string;
  sidebarTab: "mcps" | "skills";
  sidebarSource: "local" | "registry";
  isScanning: boolean;
  isExporting: boolean;
  autoSave: boolean;
  lastExport: ExportResult | null;
  toast: { message: string; type: "success" | "error" | "info" } | null;

  _undoStack: PluginData[][];
  _redoStack: PluginData[][];

  registryMcps: RegistryMcpServer[];
  registryMcpsTotal: number;
  registryMcpsLoading: boolean;
  registrySkills: RegistrySkillEntry[];
  registrySkillsLoading: boolean;
  registryQuery: string;

  scan: () => Promise<void>;
  loadPlugins: () => Promise<void>;
  refreshGitDefaults: () => Promise<void>;
  setOutputDir: (dir: string) => void;
  setMarketplaceSettings: (patch: Partial<MarketplaceSettings>) => void;
  setMarketplaceMetadata: (
    patch: Partial<MarketplaceSettings["metadata"]>
  ) => void;
  setMarketplaceOwner: (patch: Partial<MarketplaceSettings["owner"]>) => void;
  addCategory: (name: string) => void;
  removeCategory: (name: string) => void;
  setSelectedPluginId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSidebarTab: (tab: "mcps" | "skills") => void;
  setSidebarSource: (source: "local" | "registry") => void;
  setToast: (toast: WizardState["toast"]) => void;
  setRegistryQuery: (q: string) => void;
  setAutoSave: (on: boolean) => void;
  searchRegistryMcps: (query: string) => Promise<void>;
  searchRegistrySkills: (query: string) => Promise<void>;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  addPlugin: (name: string, description: string, position?: { x: number; y: number }) => string;
  removePlugin: (id: string) => void;
  updatePlugin: (id: string, updates: PluginScalarUpdate) => void;

  addMcpToPlugin: (pluginId: string, mcp: McpServer) => void;
  removeMcpFromPlugin: (pluginId: string, mcpId: string) => void;
  addSkillToPlugin: (pluginId: string, skill: Skill) => void;
  removeSkillFromPlugin: (pluginId: string, skillId: string) => void;

  exportPlugins: () => Promise<void>;
  silentExport: () => Promise<void>;
}

function pushHistory(state: WizardState): Pick<WizardState, "_undoStack" | "_redoStack"> {
  const stack = [...state._undoStack, state.plugins];
  if (stack.length > MAX_HISTORY) stack.shift();
  return { _undoStack: stack, _redoStack: [] };
}

function registryMcpToLocal(server: RegistryMcpServer): McpServer {
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
    sourceFilePath: server.websiteUrl || `https://registry.modelcontextprotocol.io`,
    scope: "global",
    config,
  };
}

function registrySkillToLocal(entry: RegistrySkillEntry): Skill {
  return {
    id: `skills.sh:${entry.id}`,
    name: entry.name,
    description: `From ${entry.source} (${entry.installs.toLocaleString()} installs)`,
    sourceApplication: "skills.sh",
    sourceFilePath: `https://skills.sh`,
    scope: "global",
    content: `# ${entry.name}\n\nInstall from: ${entry.source}\nSkill ID: ${entry.skillId}\n`,
  };
}

export { registryMcpToLocal, registrySkillToLocal };
export type { RegistrySkillEntry };

export const useWizardStore = create<WizardState>((set, get) => ({
  mcpServers: [],
  skills: [],
  plugins: [],
  outputDir: "./marketplace-output",
  marketplaceSettings: createDefaultMarketplaceSettings(null, null),
  gitDefaults: null,
  categories: [],
  selectedPluginId: null,
  searchQuery: "",
  sidebarTab: "mcps",
  sidebarSource: "local",
  isScanning: false,
  isExporting: false,
  autoSave: true,
  lastExport: null,
  toast: null,

  _undoStack: [],
  _redoStack: [],

  registryMcps: [],
  registryMcpsTotal: 0,
  registryMcpsLoading: false,
  registrySkills: [],
  registrySkillsLoading: false,
  registryQuery: "",

  refreshGitDefaults: async () => {
    try {
      const res = await fetch("/api/git-config");
      if (!res.ok) return;
      const data = await res.json();
      set({
        gitDefaults: {
          userName: data.userName ?? null,
          userEmail: data.userEmail ?? null,
          remoteUrl: data.remoteUrl ?? null,
        },
      });
    } catch {
      /* ignore */
    }
  },

  loadPlugins: async () => {
    const { outputDir, refreshGitDefaults } = get();
    await refreshGitDefaults();
    const { gitDefaults } = get();

    try {
      const pluginsUrl = new URL("/api/plugins", window.location.origin);
      pluginsUrl.searchParams.set("dir", outputDir);
      const marketUrl = new URL("/api/marketplace", window.location.origin);
      marketUrl.searchParams.set("dir", outputDir);

      const [pRes, mRes] = await Promise.all([
        fetch(pluginsUrl.toString()),
        fetch(marketUrl.toString()),
      ]);

      let loaded: PluginData[] = [];
      if (pRes.ok) {
        const data = await pRes.json();
        loaded = data.plugins || [];
      }

      let manifest: MarketplaceManifest | null = null;
      if (mRes.ok) {
        const mData = await mRes.json();
        manifest = mData.manifest ?? null;
      }

      loaded = mergePluginsWithManifest(loaded, manifest);

      let marketplaceSettings: MarketplaceSettings;
      if (manifest) {
        marketplaceSettings = settingsFromManifest(manifest);
      } else {
        marketplaceSettings = createDefaultMarketplaceSettings(
          gitDefaults?.userName,
          gitDefaults?.userEmail
        );
      }

      const toast =
        loaded.length > 0
          ? {
              message: `Loaded ${loaded.length} plugin${loaded.length !== 1 ? "s" : ""} from ${outputDir}`,
              type: "info" as const,
            }
          : get().toast;

      const seedCats = new Set(get().categories);
      for (const p of loaded) {
        if (p.category?.trim()) seedCats.add(p.category.trim());
      }

      set({
        plugins: loaded,
        marketplaceSettings,
        categories: [...seedCats],
        _undoStack: [],
        _redoStack: [],
        ...(toast ? { toast } : {}),
      });
    } catch {
      // no existing plugins
    }
  },

  scan: async () => {
    set({ isScanning: true });
    try {
      const res = await fetch("/api/scan");
      if (!res.ok) throw new Error("Scan failed");
      const data = await res.json();
      set({
        mcpServers: data.mcpServers,
        skills: data.skills,
        isScanning: false,
        toast: {
          message: `Found ${data.mcpServers.length} MCPs and ${data.skills.length} skills`,
          type: "success",
        },
      });
    } catch (error) {
      set({
        isScanning: false,
        toast: {
          message: error instanceof Error ? error.message : "Scan failed",
          type: "error",
        },
      });
    }
  },

  setOutputDir: (outputDir) => set({ outputDir }),
  setMarketplaceSettings: (patch) =>
    set((s) => {
      const { owner, metadata, ...rest } = patch;
      return {
        marketplaceSettings: {
          ...s.marketplaceSettings,
          ...rest,
          owner: { ...s.marketplaceSettings.owner, ...owner },
          metadata: { ...s.marketplaceSettings.metadata, ...metadata },
        },
      };
    }),
  setMarketplaceMetadata: (patch) =>
    set((s) => ({
      marketplaceSettings: {
        ...s.marketplaceSettings,
        metadata: { ...s.marketplaceSettings.metadata, ...patch },
      },
    })),
  setMarketplaceOwner: (patch) =>
    set((s) => ({
      marketplaceSettings: {
        ...s.marketplaceSettings,
        owner: { ...s.marketplaceSettings.owner, ...patch },
      },
    })),
  addCategory: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => {
      if (s.categories.includes(trimmed)) return s;
      return { categories: [...s.categories, trimmed] };
    });
  },
  removeCategory: (name) =>
    set((s) => ({ categories: s.categories.filter((c) => c !== name) })),
  setSelectedPluginId: (selectedPluginId) => set({ selectedPluginId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setSidebarSource: (sidebarSource) => set({ sidebarSource }),
  setToast: (toast) => set({ toast }),
  setRegistryQuery: (registryQuery) => set({ registryQuery }),
  setAutoSave: (autoSave) => {
    set({ autoSave });
    try {
      localStorage.setItem("marketplace-wizard:autoSave", String(autoSave));
    } catch {
      /* ignore */
    }
  },

  undo: () => {
    const { _undoStack, plugins } = get();
    if (_undoStack.length === 0) return;
    const prev = _undoStack[_undoStack.length - 1];
    set({
      plugins: prev,
      _undoStack: _undoStack.slice(0, -1),
      _redoStack: [...get()._redoStack, plugins],
    });
  },
  redo: () => {
    const { _redoStack, plugins } = get();
    if (_redoStack.length === 0) return;
    const next = _redoStack[_redoStack.length - 1];
    set({
      plugins: next,
      _redoStack: _redoStack.slice(0, -1),
      _undoStack: [...get()._undoStack, plugins],
    });
  },
  canUndo: () => get()._undoStack.length > 0,
  canRedo: () => get()._redoStack.length > 0,

  searchRegistryMcps: async (query: string) => {
    set({ registryMcpsLoading: true });
    try {
      const url = new URL("/api/registry/mcps", window.location.origin);
      if (query) url.searchParams.set("q", query);
      url.searchParams.set("limit", "50");
      const res = await fetch(url.toString());
      const data = await res.json();
      set({
        registryMcps: data.servers || [],
        registryMcpsTotal: data.total || 0,
        registryMcpsLoading: false,
      });
    } catch {
      set({ registryMcpsLoading: false });
    }
  },

  searchRegistrySkills: async (query: string) => {
    if (!query) {
      set({ registrySkills: [], registrySkillsLoading: false });
      return;
    }
    set({ registrySkillsLoading: true });
    try {
      const url = new URL("/api/registry/skills", window.location.origin);
      url.searchParams.set("q", query);
      url.searchParams.set("limit", "50");
      const res = await fetch(url.toString());
      const data = await res.json();
      set({
        registrySkills: data.skills || [],
        registrySkillsLoading: false,
      });
    } catch {
      set({ registrySkillsLoading: false });
    }
  },

  addPlugin: (name, description) => {
    const state = get();
    const id = crypto.randomUUID();
    const slug = slugify(name);
    const plugin: PluginData = {
      id,
      name,
      slug,
      description,
      version: "1.0.0",
      mcps: [],
      skills: [],
      ...authorFromGit(state.gitDefaults),
    };
    set({
      plugins: [...state.plugins, plugin],
      ...pushHistory(state),
    });
    return id;
  },

  removePlugin: (id) => {
    const state = get();
    const plugin = state.plugins.find((p) => p.id === id);
    set({
      plugins: state.plugins.filter((p) => p.id !== id),
      selectedPluginId: state.selectedPluginId === id ? null : state.selectedPluginId,
      ...pushHistory(state),
    });
    if (plugin) {
      const { outputDir } = state;
      const url = new URL("/api/plugins", window.location.origin);
      url.searchParams.set("dir", outputDir);
      url.searchParams.set("slug", plugin.slug);
      fetch(url.toString(), { method: "DELETE" }).catch(() => {});
    }
  },

  updatePlugin: (id, updates) => {
    const state = get();
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates };
        if (updates.name) updated.slug = slugify(updates.name);
        return updated;
      }),
      ...pushHistory(state),
    });
  },

  addMcpToPlugin: (pluginId, mcp) => {
    const state = get();
    const plugin = state.plugins.find((p) => p.id === pluginId);
    if (plugin?.mcps.some((m) => m.id === mcp.id)) return;
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p;
        return { ...p, mcps: [...p.mcps, mcp] };
      }),
      ...pushHistory(state),
    });
  },

  removeMcpFromPlugin: (pluginId, mcpId) => {
    const state = get();
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p;
        return { ...p, mcps: p.mcps.filter((m) => m.id !== mcpId) };
      }),
      ...pushHistory(state),
    });
  },

  addSkillToPlugin: (pluginId, skill) => {
    const state = get();
    const plugin = state.plugins.find((p) => p.id === pluginId);
    if (plugin?.skills.some((s) => s.id === skill.id)) return;
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p;
        return { ...p, skills: [...p.skills, skill] };
      }),
      ...pushHistory(state),
    });
  },

  removeSkillFromPlugin: (pluginId, skillId) => {
    const state = get();
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p;
        return { ...p, skills: p.skills.filter((s) => s.id !== skillId) };
      }),
      ...pushHistory(state),
    });
  },

  exportPlugins: async () => {
    const { plugins, outputDir, marketplaceSettings } = get();
    if (plugins.length === 0) {
      set({ toast: { message: "No plugins to export", type: "error" } });
      return;
    }

    set({ isExporting: true });
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outputDir, plugins, marketplaceSettings }),
      });
      const result = await res.json();

      if (result.success) {
        set({
          isExporting: false,
          lastExport: result,
          toast: {
            message: `Exported ${result.pluginCount} plugins (${result.files.length} files)`,
            type: "success",
          },
        });
      } else {
        throw new Error(result.error || "Export failed");
      }
    } catch (error) {
      set({
        isExporting: false,
        toast: {
          message: error instanceof Error ? error.message : "Export failed",
          type: "error",
        },
      });
    }
  },

  silentExport: async () => {
    const { plugins, outputDir, marketplaceSettings, isExporting } = get();
    if (plugins.length === 0 || isExporting) return;
    try {
      await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outputDir, plugins, marketplaceSettings }),
      });
    } catch {
      // silent
    }
  },
}));
