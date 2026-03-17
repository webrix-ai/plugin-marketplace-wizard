"use client";

import { create } from "zustand";
import type {
  McpServer,
  Skill,
  PluginData,
  ExportResult,
  RegistryMcpServer,
} from "./types";
import { slugify } from "./utils";

interface RegistrySkillEntry {
  id: string;
  skillId: string;
  name: string;
  installs: number;
  source: string;
}

interface WizardState {
  mcpServers: McpServer[];
  skills: Skill[];
  plugins: PluginData[];
  outputDir: string;
  orgName: string;
  searchQuery: string;
  sidebarTab: "mcps" | "skills";
  sidebarSource: "local" | "registry";
  isScanning: boolean;
  isExporting: boolean;
  autoSave: boolean;
  lastExport: ExportResult | null;
  toast: { message: string; type: "success" | "error" | "info" } | null;

  registryMcps: RegistryMcpServer[];
  registryMcpsTotal: number;
  registryMcpsLoading: boolean;
  registrySkills: RegistrySkillEntry[];
  registrySkillsLoading: boolean;
  registryQuery: string;

  scan: () => Promise<void>;
  loadPlugins: () => Promise<void>;
  setOutputDir: (dir: string) => void;
  setOrgName: (name: string) => void;
  setSearchQuery: (query: string) => void;
  setSidebarTab: (tab: "mcps" | "skills") => void;
  setSidebarSource: (source: "local" | "registry") => void;
  setToast: (toast: WizardState["toast"]) => void;
  setRegistryQuery: (q: string) => void;
  setAutoSave: (on: boolean) => void;
  searchRegistryMcps: (query: string) => Promise<void>;
  searchRegistrySkills: (query: string) => Promise<void>;

  addPlugin: (name: string, description: string, position?: { x: number; y: number }) => string;
  removePlugin: (id: string) => void;
  updatePlugin: (id: string, updates: Partial<Pick<PluginData, "name" | "description">>) => void;

  addMcpToPlugin: (pluginId: string, mcp: McpServer) => void;
  removeMcpFromPlugin: (pluginId: string, mcpId: string) => void;
  addSkillToPlugin: (pluginId: string, skill: Skill) => void;
  removeSkillFromPlugin: (pluginId: string, skillId: string) => void;

  exportPlugins: () => Promise<void>;
  silentExport: () => Promise<void>;
}

function registryMcpToLocal(server: RegistryMcpServer): McpServer {
  const config: McpServer["config"] = {};
  if (server.remotes?.[0]) {
    config.type = server.remotes[0].type === "streamable-http" ? "streamable-http" : server.remotes[0].type;
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
  orgName: "my-org",
  searchQuery: "",
  sidebarTab: "mcps",
  sidebarSource: "local",
  isScanning: false,
  isExporting: false,
  autoSave: true,
  lastExport: null,
  toast: null,

  registryMcps: [],
  registryMcpsTotal: 0,
  registryMcpsLoading: false,
  registrySkills: [],
  registrySkillsLoading: false,
  registryQuery: "",

  loadPlugins: async () => {
    const { outputDir } = get();
    try {
      const url = new URL("/api/plugins", window.location.origin);
      url.searchParams.set("dir", outputDir);
      const res = await fetch(url.toString());
      if (!res.ok) return;
      const data = await res.json();
      const loaded: PluginData[] = data.plugins || [];
      if (loaded.length > 0) {
        set({
          plugins: loaded,
          toast: {
            message: `Loaded ${loaded.length} plugin${loaded.length !== 1 ? "s" : ""} from ${outputDir}`,
            type: "info",
          },
        });
      }
    } catch {
      // no existing plugins, that's fine
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
  setOrgName: (orgName) => set({ orgName }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setSidebarSource: (sidebarSource) => set({ sidebarSource }),
  setToast: (toast) => set({ toast }),
  setRegistryQuery: (registryQuery) => set({ registryQuery }),
  setAutoSave: (autoSave) => {
    set({ autoSave });
    try { localStorage.setItem("marketplace-wizard:autoSave", String(autoSave)); } catch {}
  },

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

  addPlugin: (name, description, _position) => {
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
    };
    set((state) => ({ plugins: [...state.plugins, plugin] }));
    return id;
  },

  removePlugin: (id) => {
    const plugin = get().plugins.find((p) => p.id === id);
    set((state) => ({
      plugins: state.plugins.filter((p) => p.id !== id),
    }));
    if (plugin) {
      const { outputDir } = get();
      const url = new URL("/api/plugins", window.location.origin);
      url.searchParams.set("dir", outputDir);
      url.searchParams.set("slug", plugin.slug);
      fetch(url.toString(), { method: "DELETE" }).catch(() => {});
    }
  },

  updatePlugin: (id, updates) => {
    set((state) => ({
      plugins: state.plugins.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates };
        if (updates.name) updated.slug = slugify(updates.name);
        return updated;
      }),
    }));
  },

  addMcpToPlugin: (pluginId, mcp) => {
    set((state) => ({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p;
        if (p.mcps.some((m) => m.id === mcp.id)) return p;
        return { ...p, mcps: [...p.mcps, mcp] };
      }),
    }));
  },

  removeMcpFromPlugin: (pluginId, mcpId) => {
    set((state) => ({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p;
        return { ...p, mcps: p.mcps.filter((m) => m.id !== mcpId) };
      }),
    }));
  },

  addSkillToPlugin: (pluginId, skill) => {
    set((state) => ({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p;
        if (p.skills.some((s) => s.id === skill.id)) return p;
        return { ...p, skills: [...p.skills, skill] };
      }),
    }));
  },

  removeSkillFromPlugin: (pluginId, skillId) => {
    set((state) => ({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p;
        return { ...p, skills: p.skills.filter((s) => s.id !== skillId) };
      }),
    }));
  },

  exportPlugins: async () => {
    const { plugins, outputDir, orgName } = get();
    if (plugins.length === 0) {
      set({ toast: { message: "No plugins to export", type: "error" } });
      return;
    }

    set({ isExporting: true });
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outputDir, plugins, orgName }),
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
    const { plugins, outputDir, orgName, isExporting } = get();
    if (plugins.length === 0 || isExporting) return;
    try {
      await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outputDir, plugins, orgName }),
      });
    } catch {
      // silent
    }
  },
}));
