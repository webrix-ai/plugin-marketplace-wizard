"use client";

import { create } from "zustand";
import { toast as sonnerToast } from "sonner";
import type { MarketplaceSettings, MarketplaceManifest } from "./marketplace-schema";
import type {
  McpServer,
  Skill,
  PluginData,
  ExportResult,
  ExportTargets,
  RegistryMcpServer,
  RegistrySkillEntry,
  GitDefaults,
  CustomRegistry,
  PluginScalarUpdate,
} from "./types";
import { createDefaultMarketplaceSettings } from "./default-marketplace-settings";
import {
  mergePluginsWithManifest,
  settingsFromManifest,
} from "./merge-marketplace-manifest";
import { slugify } from "./utils";
import { authorFromGit } from "./git-defaults";
import {
  registryMcpToLocal,
  registrySkillToLocal,
  persistCustomRegistryUrls,
} from "./services/registry";
import { MAX_UNDO_HISTORY, STORAGE_KEYS } from "./constants";

interface WizardState {
  mcpServers: McpServer[];
  skills: Skill[];
  plugins: PluginData[];
  marketplaceDir: string;
  marketplaceSettings: MarketplaceSettings;
  gitDefaults: GitDefaults | null;
  categories: string[];
  selectedPluginId: string | null;
  selectedItemId: string | null;
  selectedItemType: "mcp" | "skill" | null;
  searchQuery: string;
  sidebarTab: "mcps" | "skills";
  sidebarSource: "local" | "official" | "custom";
  isScanning: boolean;
  isPluginsLoading: boolean;
  isExporting: boolean;
  autoSave: boolean;
  exportTargets: ExportTargets;
  lastExport: ExportResult | null;

  _undoStack: PluginData[][];
  _redoStack: PluginData[][];
  _eventSource: EventSource | null;

  registryMcps: RegistryMcpServer[];
  registryMcpsTotal: number;
  registryMcpsLoading: boolean;
  registrySkills: RegistrySkillEntry[];
  registrySkillsLoading: boolean;
  registryQuery: string;
  officialPrefetched: boolean;

  customRegistries: CustomRegistry[];
  customRegistryQuery: string;

  scan: () => Promise<void>;
  loadPlugins: () => Promise<void>;
  connectPluginStream: () => void;
  disconnectPluginStream: () => void;
  refreshGitDefaults: () => Promise<void>;
  setMarketplaceSettings: (patch: Partial<MarketplaceSettings>) => void;
  setMarketplaceMetadata: (
    patch: Partial<MarketplaceSettings["metadata"]>
  ) => void;
  setMarketplaceOwner: (patch: Partial<MarketplaceSettings["owner"]>) => void;
  addCategory: (name: string) => void;
  removeCategory: (name: string) => void;
  setSelectedPluginId: (id: string | null) => void;
  setSelectedItemInPlugin: (itemId: string | null, itemType: "mcp" | "skill" | null) => void;
  setSearchQuery: (query: string) => void;
  setSidebarTab: (tab: "mcps" | "skills") => void;
  setSidebarSource: (source: "local" | "official" | "custom") => void;
  setRegistryQuery: (q: string) => void;
  setAutoSave: (on: boolean) => void;
  setExportTargets: (targets: Partial<ExportTargets>) => void;
  detectExportTargets: () => Promise<void>;
  deleteExportFolders: (targets: string[]) => Promise<void>;
  searchRegistryMcps: (query: string) => Promise<void>;
  searchRegistrySkills: (query: string) => Promise<void>;
  prefetchOfficialRegistry: () => void;
  fetchRegistrySkillContent: (entry: RegistrySkillEntry) => Promise<Skill>;

  addCustomRegistry: (url: string) => Promise<void>;
  removeCustomRegistry: (url: string) => void;
  refreshCustomRegistry: (url: string) => Promise<void>;
  setCustomRegistryQuery: (q: string) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  addPlugin: (name: string, description: string, position?: { x: number; y: number }) => string;
  removePlugin: (id: string) => void;
  updatePlugin: (id: string, updates: PluginScalarUpdate) => void;

  addMcpToPlugin: (pluginId: string, mcp: McpServer) => void;
  removeMcpFromPlugin: (pluginId: string, mcpId: string) => void;
  updateMcpInPlugin: (pluginId: string, mcpId: string, updates: Partial<McpServer>) => void;
  addSkillToPlugin: (pluginId: string, skill: Skill) => void;
  removeSkillFromPlugin: (pluginId: string, skillId: string) => void;
  updateSkillInPlugin: (pluginId: string, skillId: string, updates: Partial<Skill>) => void;

  importSkillFileToPlugin: (pluginId: string, file: File) => Promise<void>;
  skillImportError: string | null;
  setSkillImportError: (error: string | null) => void;

  exportPlugins: () => Promise<void>;
  silentExport: () => Promise<void>;
}

function pushHistory(state: WizardState): Pick<WizardState, "_undoStack" | "_redoStack"> {
  const stack = [...state._undoStack, state.plugins];
  if (stack.length > MAX_UNDO_HISTORY) stack.shift();
  return { _undoStack: stack, _redoStack: [] };
}

export { registryMcpToLocal, registrySkillToLocal };

export const useWizardStore = create<WizardState>((set, get) => ({
  mcpServers: [],
  skills: [],
  plugins: [],
  marketplaceDir: "",
  marketplaceSettings: createDefaultMarketplaceSettings(null, null),
  gitDefaults: null,
  categories: [],
  selectedPluginId: null,
  selectedItemId: null,
  selectedItemType: null,
  searchQuery: "",
  sidebarTab: "mcps",
  sidebarSource: "local",
  isScanning: false,
  isPluginsLoading: false,
  isExporting: false,
  autoSave: true,
  exportTargets: { cursor: true, claude: true },
  lastExport: null,

  _undoStack: [],
  _redoStack: [],
  _eventSource: null,

  registryMcps: [],
  registryMcpsTotal: 0,
  registryMcpsLoading: false,
  registrySkills: [],
  registrySkillsLoading: false,
  registryQuery: "",
  officialPrefetched: false,

  skillImportError: null,

  customRegistries: [],
  customRegistryQuery: "",

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
    set({ isPluginsLoading: true });
    const { refreshGitDefaults } = get();
    await refreshGitDefaults();
    const { gitDefaults } = get();

    try {
      const [pRes, mRes] = await Promise.all([
        fetch("/api/plugins"),
        fetch("/api/marketplace"),
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
        isPluginsLoading: false,
      });
    } catch {
      set({ isPluginsLoading: false });
    }
  },

  connectPluginStream: () => {
    const prev = get()._eventSource;
    if (prev) {
      prev.close();
    }

    const { refreshGitDefaults } = get();
    set({ isPluginsLoading: true });

    refreshGitDefaults().then(() => {
      const { gitDefaults } = get();
      const url = new URL("/api/plugins/stream", window.location.origin);

      const es = new EventSource(url.toString());
      let manifest: MarketplaceManifest | null = null;
      let streamedPlugins: PluginData[] = [];

      es.addEventListener("marketplace_dir", (e) => {
        set({ marketplaceDir: JSON.parse(e.data) });
      });

      es.addEventListener("manifest", (e) => {
        manifest = JSON.parse(e.data);
        if (manifest) {
          set({ marketplaceSettings: settingsFromManifest(manifest) });
        } else {
          set({
            marketplaceSettings: createDefaultMarketplaceSettings(
              gitDefaults?.userName,
              gitDefaults?.userEmail
            ),
          });
        }
      });

      es.addEventListener("plugin", (e) => {
        const plugin: PluginData = JSON.parse(e.data);
        streamedPlugins.push(plugin);
        const merged = mergePluginsWithManifest([...streamedPlugins], manifest);
        const seedCats = new Set(get().categories);
        for (const p of merged) {
          if (p.category?.trim()) seedCats.add(p.category.trim());
        }
        set({ plugins: merged, categories: [...seedCats] });
      });

      es.addEventListener("done", () => {
        set({
          isPluginsLoading: false,
          _undoStack: [],
          _redoStack: [],
        });
      });

      es.addEventListener("plugin:updated", (e) => {
        const updated: PluginData = JSON.parse(e.data);
        const merged = mergePluginsWithManifest([updated], manifest)[0];
        set((s) => {
          const exists = s.plugins.some((p) => p.slug === merged.slug);
          const newPlugins = exists
            ? s.plugins.map((p) => (p.slug === merged.slug ? { ...merged, id: p.id } : p))
            : [...s.plugins, merged];
          const seedCats = new Set(s.categories);
          if (merged.category?.trim()) seedCats.add(merged.category.trim());
          return { plugins: newPlugins, categories: [...seedCats] };
        });
      });

      es.addEventListener("plugin:removed", (e) => {
        const { slug } = JSON.parse(e.data);
        set((s) => ({
          plugins: s.plugins.filter((p) => p.slug !== slug),
          selectedPluginId:
            s.plugins.find((p) => p.slug === slug)?.id === s.selectedPluginId
              ? null
              : s.selectedPluginId,
        }));
      });

      es.onerror = () => {
        set({ isPluginsLoading: false });
      };

      set({ _eventSource: es });
    });
  },

  disconnectPluginStream: () => {
    const es = get()._eventSource;
    if (es) {
      es.close();
      set({ _eventSource: null });
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
      });
    } catch {
      set({ isScanning: false });
    }
  },

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
  setSelectedPluginId: (selectedPluginId) => {
    const prev = get().selectedPluginId;
    if (selectedPluginId !== prev) {
      set({ selectedPluginId, selectedItemId: null, selectedItemType: null });
    } else {
      set({ selectedPluginId });
    }
  },
  setSelectedItemInPlugin: (selectedItemId, selectedItemType) => set({ selectedItemId, selectedItemType }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setSidebarSource: (sidebarSource) => set({ sidebarSource }),
  setRegistryQuery: (registryQuery) => set({ registryQuery }),
  setCustomRegistryQuery: (customRegistryQuery) => set({ customRegistryQuery }),
  setAutoSave: (autoSave) => {
    set({ autoSave });
    try {
      localStorage.setItem(STORAGE_KEYS.autoSave, String(autoSave));
    } catch {
      /* ignore */
    }
  },
  setExportTargets: (patch) => {
    const updated = { ...get().exportTargets, ...patch };
    set({ exportTargets: updated });
  },
  detectExportTargets: async () => {
    try {
      const res = await fetch("/api/export-targets");
      if (!res.ok) return;
      const data = await res.json();
      set({ exportTargets: { cursor: !!data.cursor, claude: !!data.claude } });
    } catch {
      /* ignore */
    }
  },
  deleteExportFolders: async (targets: string[]) => {
    try {
      await fetch("/api/export-targets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets }),
      });
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
    if (query.length < 2) {
      set({ registryMcps: [], registryMcpsTotal: 0, registryMcpsLoading: false });
      return;
    }
    set({ registryMcpsLoading: true });
    try {
      const url = new URL("/api/registry/mcps", window.location.origin);
      url.searchParams.set("q", query);
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
    if (query.length < 2) {
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

  prefetchOfficialRegistry: () => {
    if (get().officialPrefetched) return;
    set({ officialPrefetched: true });
  },

  fetchRegistrySkillContent: async (entry: RegistrySkillEntry): Promise<Skill> => {
    if (!entry.source) {
      return registrySkillToLocal(entry);
    }

    try {
      const url = new URL("/api/registry/skill-content", window.location.origin);
      url.searchParams.set("source", entry.source);
      url.searchParams.set("skill", entry.name);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok || !data.content) {
        return registrySkillToLocal(entry);
      }

      return registrySkillToLocal(entry, data.content);
    } catch {
      return registrySkillToLocal(entry);
    }
  },

  addCustomRegistry: async (rawUrl: string) => {
    const trimmed = rawUrl.trim().replace(/\/+$/, "");
    if (!trimmed) return;

    const existing = get().customRegistries;
    if (existing.some((r) => r.url === trimmed)) {
      sonnerToast.info("Registry already added");
      return;
    }

    let hostname: string;
    try {
      hostname = new URL(trimmed).hostname;
    } catch {
      sonnerToast.error("Invalid URL");
      return;
    }

    const entry: CustomRegistry = {
      url: trimmed,
      name: hostname,
      servers: [],
      total: 0,
      loading: true,
    };

    set({ customRegistries: [...existing, entry] });

    try {
      const url = new URL("/api/registry/custom", window.location.origin);
      url.searchParams.set("registryUrl", trimmed);
      url.searchParams.set("limit", "100");
      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch");

      set({
        customRegistries: get().customRegistries.map((r) =>
          r.url === trimmed
            ? { ...r, servers: data.servers || [], total: data.total || 0, loading: false }
            : r
        ),
      });
      persistCustomRegistryUrls(get().customRegistries);
      sonnerToast.success(`Loaded ${data.servers?.length || 0} servers from ${hostname}`);
    } catch (err) {
      set({
        customRegistries: get().customRegistries.map((r) =>
          r.url === trimmed
            ? { ...r, loading: false, error: err instanceof Error ? err.message : "Failed" }
            : r
        ),
      });
      sonnerToast.error(`Failed to load registry: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  },

  removeCustomRegistry: (url: string) => {
    set({ customRegistries: get().customRegistries.filter((r) => r.url !== url) });
    persistCustomRegistryUrls(get().customRegistries);
  },

  refreshCustomRegistry: async (registryUrl: string) => {
    set({
      customRegistries: get().customRegistries.map((r) =>
        r.url === registryUrl ? { ...r, loading: true, error: undefined } : r
      ),
    });

    try {
      const url = new URL("/api/registry/custom", window.location.origin);
      url.searchParams.set("registryUrl", registryUrl);
      const q = get().customRegistryQuery;
      if (q) url.searchParams.set("q", q);
      url.searchParams.set("limit", "100");
      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch");

      set({
        customRegistries: get().customRegistries.map((r) =>
          r.url === registryUrl
            ? { ...r, servers: data.servers || [], total: data.total || 0, loading: false }
            : r
        ),
      });
    } catch (err) {
      set({
        customRegistries: get().customRegistries.map((r) =>
          r.url === registryUrl
            ? { ...r, loading: false, error: err instanceof Error ? err.message : "Failed" }
            : r
        ),
      });
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
      const url = new URL("/api/plugins", window.location.origin);
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

  updateMcpInPlugin: (pluginId, mcpId, updates) => {
    const state = get();
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p;
        return {
          ...p,
          mcps: p.mcps.map((m) => (m.id === mcpId ? { ...m, ...updates } : m)),
        };
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

  updateSkillInPlugin: (pluginId, skillId, updates) => {
    const state = get();
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p;
        return {
          ...p,
          skills: p.skills.map((s) => (s.id === skillId ? { ...s, ...updates } : s)),
        };
      }),
      ...pushHistory(state),
    });
  },

  setSkillImportError: (error) => set({ skillImportError: error }),

  importSkillFileToPlugin: async (pluginId: string, file: File) => {
    const placeholderId = `uploading:${Date.now()}:${file.name}`;
    const baseName = file.name.replace(/\.(zip|skill)$/i, "");

    const placeholder: Skill = {
      id: placeholderId,
      name: baseName,
      description: "",
      sourceApplication: "uploaded",
      sourceFilePath: file.name,
      scope: "global",
      content: "",
      _loading: true,
    };

    set((s) => ({
      plugins: s.plugins.map((p) =>
        p.id === pluginId ? { ...p, skills: [...p.skills, placeholder] } : p
      ),
    }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-skill", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        set((s) => ({
          plugins: s.plugins.map((p) =>
            p.id === pluginId
              ? { ...p, skills: p.skills.filter((sk) => sk.id !== placeholderId) }
              : p
          ),
          skillImportError: data.error || "Upload failed",
        }));
        return;
      }

      const realSkill: Skill = {
        id: `uploaded:${Date.now()}:${data.skill.name}`,
        name: data.skill.name,
        description: data.skill.description,
        sourceApplication: "uploaded",
        sourceFilePath: file.name,
        scope: "global",
        content: data.skill.content,
      };

      set((s) => ({
        plugins: s.plugins.map((p) =>
          p.id === pluginId
            ? { ...p, skills: p.skills.map((sk) => (sk.id === placeholderId ? realSkill : sk)) }
            : p
        ),
        skills: [...s.skills, realSkill],
      }));
    } catch (err) {
      set((s) => ({
        plugins: s.plugins.map((p) =>
          p.id === pluginId
            ? { ...p, skills: p.skills.filter((sk) => sk.id !== placeholderId) }
            : p
        ),
        skillImportError: err instanceof Error ? err.message : "Failed to import skill",
      }));
    }
  },

  exportPlugins: async () => {
    const { plugins, marketplaceSettings, exportTargets } = get();
    if (plugins.length === 0) {
      sonnerToast.error("No plugins to export");
      return;
    }

    set({ isExporting: true });
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plugins, marketplaceSettings, exportTargets }),
      });
      const result = await res.json();

      if (result.success) {
        set({ isExporting: false, lastExport: result });
        sonnerToast.success(
          `Saved ${result.pluginCount} plugins (${result.files.length} files)`
        );
      } else {
        throw new Error(result.error || "Save failed");
      }
    } catch (error) {
      set({ isExporting: false });
      sonnerToast.error(
        error instanceof Error ? error.message : "Save failed"
      );
    }
  },

  silentExport: async () => {
    const { plugins, marketplaceSettings, exportTargets, isExporting } = get();
    if (plugins.length === 0 || isExporting) return;
    try {
      await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plugins, marketplaceSettings, exportTargets }),
      });
    } catch {
      // silent
    }
  },
}));
