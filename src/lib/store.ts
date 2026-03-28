"use client"

import { create } from "zustand"
import { toast as sonnerToast } from "sonner"
import type {
  MarketplaceSettings,
  MarketplaceManifest,
} from "./marketplace-schema"
import type {
  McpServer,
  Skill,
  AgentData,
  PluginData,
  PluginHook,
  ExportResult,
  ExportTargets,
  RegistryMcpServer,
  RegistrySkillEntry,
  GitDefaults,
  CustomRegistry,
  CustomSkillRepo,
  CustomGitHubSkill,
  PluginScalarUpdate,
  ClaudeHookItem,
  CursorHookItem,
} from "./types"
import { createDefaultMarketplaceSettings } from "./default-marketplace-settings"
import {
  mergePluginsWithManifest,
  settingsFromManifest,
} from "./merge-marketplace-manifest"
import { slugify } from "./utils"
import { authorFromGit } from "./git-defaults"
import {
  registryMcpToLocal,
  registrySkillToLocal,
  persistCustomRegistryUrls,
} from "./services/registry"
import { MAX_UNDO_HISTORY, STORAGE_KEYS, WRITE_GUARD_MS } from "./constants"

interface WizardState {
  mcpServers: McpServer[]
  skills: Skill[]
  agents: AgentData[]
  plugins: PluginData[]
  marketplaceDir: string
  marketplaceSettings: MarketplaceSettings
  gitDefaults: GitDefaults | null
  categories: string[]
  selectedPluginId: string | null
  selectedItemId: string | null
  selectedItemType: "mcp" | "skill" | "agent" | "hook" | null
  searchQuery: string
  sidebarTab: "mcps" | "skills" | "agents" | "hooks"
  sidebarSource: "local" | "registry" | "custom"
  sidebarCollapsed: boolean
  isScanning: boolean
  isPluginsLoading: boolean
  isExporting: boolean
  autoSave: boolean
  exportTargets: ExportTargets
  lastExport: ExportResult | null

  _undoStack: PluginData[][]
  _redoStack: PluginData[][]
  _eventSource: EventSource | null
  _lastExportAt: number
  _layoutVersion: number

  registryMcps: RegistryMcpServer[]
  registryMcpsTotal: number
  registryMcpsLoading: boolean
  registrySkills: RegistrySkillEntry[]
  registrySkillsLoading: boolean
  registryQuery: string
  registryPrefetched: boolean

  customRegistries: CustomRegistry[]
  customRegistryQuery: string

  customSkillRepos: CustomSkillRepo[]

  scan: () => Promise<void>
  loadPlugins: () => Promise<void>
  connectPluginStream: () => void
  disconnectPluginStream: () => void
  refreshGitDefaults: () => Promise<void>
  setMarketplaceSettings: (patch: Partial<MarketplaceSettings>) => void
  setMarketplaceMetadata: (
    patch: Partial<MarketplaceSettings["metadata"]>,
  ) => void
  setMarketplaceOwner: (patch: Partial<MarketplaceSettings["owner"]>) => void
  addCategory: (name: string) => void
  removeCategory: (name: string) => void
  setSelectedPluginId: (id: string | null) => void
  setSelectedItemInPlugin: (
    itemId: string | null,
    itemType: "mcp" | "skill" | "agent" | "hook" | null,
  ) => void
  setSearchQuery: (query: string) => void
  setSidebarTab: (tab: "mcps" | "skills" | "agents" | "hooks") => void
  setSidebarSource: (source: "local" | "registry" | "custom") => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setRegistryQuery: (q: string) => void
  setAutoSave: (on: boolean) => void
  setExportTargets: (targets: Partial<ExportTargets>) => void
  detectExportTargets: () => Promise<void>
  deleteExportFolders: (targets: string[]) => Promise<void>
  searchRegistryMcps: (query: string) => Promise<void>
  searchRegistrySkills: (query: string) => Promise<void>
  prefetchRegistry: () => void
  fetchRegistrySkillContent: (entry: RegistrySkillEntry) => Promise<Skill>

  addCustomRegistry: (url: string) => Promise<void>
  removeCustomRegistry: (url: string) => void
  refreshCustomRegistry: (url: string) => Promise<void>
  setCustomRegistryQuery: (q: string) => void

  addCustomSkillRepo: (repoUrl: string) => Promise<void>
  removeCustomSkillRepo: (repoUrl: string) => void
  refreshCustomSkillRepo: (repoUrl: string) => Promise<void>

  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  addPlugin: (
    name: string,
    description: string,
    position?: { x: number; y: number },
  ) => string
  removePlugin: (id: string) => void
  updatePlugin: (id: string, updates: PluginScalarUpdate) => void

  addMcpToPlugin: (pluginId: string, mcp: McpServer) => void
  removeMcpFromPlugin: (pluginId: string, mcpId: string) => void
  updateMcpInPlugin: (
    pluginId: string,
    mcpId: string,
    updates: Partial<McpServer>,
  ) => void
  addSkillToPlugin: (pluginId: string, skill: Skill) => void
  removeSkillFromPlugin: (pluginId: string, skillId: string) => void
  updateSkillInPlugin: (
    pluginId: string,
    skillId: string,
    updates: Partial<Skill>,
  ) => void

  addAgentToPlugin: (pluginId: string, agent: AgentData) => void
  removeAgentFromPlugin: (pluginId: string, agentId: string) => void
  updateAgentInPlugin: (
    pluginId: string,
    agentId: string,
    updates: Partial<AgentData>,
  ) => void

  addHookToPlugin: (pluginId: string, hook: PluginHook) => void
  removeHookFromPlugin: (pluginId: string, hookId: string) => void
  updateHookInPlugin: (
    pluginId: string,
    hookId: string,
    updates: Partial<PluginHook>,
  ) => void

  importSkillFileToPlugin: (pluginId: string, file: File) => Promise<void>
  skillImportError: string | null
  setSkillImportError: (error: string | null) => void

  exportPlugins: () => Promise<void>
  silentExport: () => Promise<void>

  claudeHooks: ClaudeHookItem[]
  cursorHooks: CursorHookItem[]
  hooksLoading: boolean
  claudeHooksEnabled: boolean
  cursorHooksEnabled: boolean
  hooksQuery: string
  setHooksQuery: (q: string) => void
  scanHooks: () => Promise<void>
  addClaudeHook: (item: Omit<ClaudeHookItem, "id">) => Promise<void>
  updateClaudeHook: (
    item: ClaudeHookItem,
    updates: Partial<ClaudeHookItem>,
  ) => Promise<void>
  deleteClaudeHook: (item: ClaudeHookItem) => Promise<void>
  addCursorHook: (item: Omit<CursorHookItem, "id">) => Promise<void>
  updateCursorHook: (
    item: CursorHookItem,
    updates: Partial<CursorHookItem>,
  ) => Promise<void>
  deleteCursorHook: (item: CursorHookItem) => Promise<void>
}

function pushHistory(
  state: WizardState,
): Pick<WizardState, "_undoStack" | "_redoStack"> {
  const stack = [...state._undoStack, state.plugins]
  if (stack.length > MAX_UNDO_HISTORY) stack.shift()
  return { _undoStack: stack, _redoStack: [] }
}

export { registryMcpToLocal, registrySkillToLocal }

export const useWizardStore = create<WizardState>((set, get) => ({
  mcpServers: [],
  skills: [],
  agents: [],
  plugins: [],
  marketplaceDir: "",
  marketplaceSettings: createDefaultMarketplaceSettings(null, null),
  gitDefaults: null,
  categories: [],
  selectedPluginId: null,
  selectedItemId: null,
  selectedItemType: null,
  searchQuery: "",
  sidebarTab: "skills",
  sidebarSource: "local",
  sidebarCollapsed: false,
  isScanning: false,
  isPluginsLoading: false,
  isExporting: false,
  autoSave: true,
  exportTargets: { cursor: true, claude: true, github: true },
  lastExport: null,

  _undoStack: [],
  _redoStack: [],
  _eventSource: null,
  _lastExportAt: 0,
  _layoutVersion: 0,

  registryMcps: [],
  registryMcpsTotal: 0,
  registryMcpsLoading: false,
  registrySkills: [],
  registrySkillsLoading: false,
  registryQuery: "",
  registryPrefetched: false,

  skillImportError: null,

  customRegistries: [],
  customRegistryQuery: "",

  customSkillRepos: [],

  claudeHooks: [],
  cursorHooks: [],
  hooksLoading: false,
  claudeHooksEnabled: false,
  cursorHooksEnabled: false,
  hooksQuery: "",

  setHooksQuery: (q) => set({ hooksQuery: q }),

  scanHooks: async () => {
    set({ hooksLoading: true })
    try {
      const res = await fetch("/api/hooks")
      if (!res.ok) return
      const data = await res.json()
      set({
        claudeHooks: data.claudeHooks ?? [],
        cursorHooks: data.cursorHooks ?? [],
        claudeHooksEnabled: data.claudeEnabled ?? false,
        cursorHooksEnabled: data.cursorEnabled ?? false,
      })
    } catch {
      /* ignore */
    } finally {
      set({ hooksLoading: false })
    }
  },

  addClaudeHook: async (item) => {
    await fetch("/api/hooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "claude", item }),
    })
    await get().scanHooks()
  },

  updateClaudeHook: async (item, updates) => {
    await fetch("/api/hooks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "claude", item, updates }),
    })
    await get().scanHooks()
  },

  deleteClaudeHook: async (item) => {
    await fetch("/api/hooks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "claude", item }),
    })
    await get().scanHooks()
  },

  addCursorHook: async (item) => {
    await fetch("/api/hooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "cursor", item }),
    })
    await get().scanHooks()
  },

  updateCursorHook: async (item, updates) => {
    await fetch("/api/hooks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "cursor", item, updates }),
    })
    await get().scanHooks()
  },

  deleteCursorHook: async (item) => {
    await fetch("/api/hooks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "cursor", item }),
    })
    await get().scanHooks()
  },

  refreshGitDefaults: async () => {
    try {
      const res = await fetch("/api/git-config")
      if (!res.ok) return
      const data = await res.json()
      set({
        gitDefaults: {
          userName: data.userName ?? null,
          userEmail: data.userEmail ?? null,
          remoteUrl: data.remoteUrl ?? null,
        },
      })
    } catch {
      /* ignore */
    }
  },

  loadPlugins: async () => {
    set({ isPluginsLoading: true })
    const { refreshGitDefaults } = get()
    await refreshGitDefaults()
    const { gitDefaults } = get()

    try {
      const [pRes, mRes] = await Promise.all([
        fetch("/api/plugins"),
        fetch("/api/marketplace"),
      ])

      let loaded: PluginData[] = []
      if (pRes.ok) {
        const data = await pRes.json()
        loaded = data.plugins || []
      }

      let manifest: MarketplaceManifest | null = null
      if (mRes.ok) {
        const mData = await mRes.json()
        manifest = mData.manifest ?? null
      }

      loaded = mergePluginsWithManifest(loaded, manifest)

      let marketplaceSettings: MarketplaceSettings
      if (manifest) {
        marketplaceSettings = settingsFromManifest(manifest)
      } else {
        marketplaceSettings = createDefaultMarketplaceSettings(
          gitDefaults?.userName,
          gitDefaults?.userEmail,
        )
      }

      const seedCats = new Set(get().categories)
      for (const p of loaded) {
        if (p.category?.trim()) seedCats.add(p.category.trim())
      }

      set((s) => ({
        plugins: loaded,
        marketplaceSettings,
        categories: [...seedCats],
        _undoStack: [],
        _redoStack: [],
        isPluginsLoading: false,
        _layoutVersion: s._layoutVersion + 1,
      }))
    } catch {
      set({ isPluginsLoading: false })
    }
  },

  connectPluginStream: () => {
    const prev = get()._eventSource
    if (prev) {
      prev.close()
    }

    const { refreshGitDefaults } = get()
    set({ isPluginsLoading: true })

    refreshGitDefaults().then(() => {
      const { gitDefaults } = get()
      const url = new URL("/api/plugins/stream", window.location.origin)

      const es = new EventSource(url.toString())
      let manifest: MarketplaceManifest | null = null
      const streamedPlugins: PluginData[] = []

      es.addEventListener("marketplace_dir", (e) => {
        set({ marketplaceDir: JSON.parse(e.data) })
      })

      es.addEventListener("manifest", (e) => {
        manifest = JSON.parse(e.data)
        if (manifest) {
          set({ marketplaceSettings: settingsFromManifest(manifest) })
        } else {
          set({
            marketplaceSettings: createDefaultMarketplaceSettings(
              gitDefaults?.userName,
              gitDefaults?.userEmail,
            ),
          })
        }
      })

      es.addEventListener("plugin", (e) => {
        const plugin: PluginData = JSON.parse(e.data)
        streamedPlugins.push(plugin)
        const merged = mergePluginsWithManifest([...streamedPlugins], manifest)
        const seedCats = new Set(get().categories)
        for (const p of merged) {
          if (p.category?.trim()) seedCats.add(p.category.trim())
        }
        set({ plugins: merged, categories: [...seedCats] })
      })

      es.addEventListener("done", () => {
        set({
          isPluginsLoading: false,
          _undoStack: [],
          _redoStack: [],
        })
      })

      es.addEventListener("plugin:updated", (e) => {
        if (Date.now() - get()._lastExportAt < WRITE_GUARD_MS) return

        const updated: PluginData = JSON.parse(e.data)
        const merged = mergePluginsWithManifest([updated], manifest)[0]
        set((s) => {
          const diskSlug = merged.slug
          const diskId = merged.id
          const match = (p: PluginData) =>
            p.slug === diskSlug || p.id === diskId

          const existing = s.plugins.find(match)
          let newPlugins: PluginData[]

          if (existing) {
            newPlugins = s.plugins.map((p) => {
              if (!match(p)) return p

              const diskSkillIds = new Set(merged.skills.map((sk) => sk.id))
              const diskMcpIds = new Set(merged.mcps.map((m) => m.id))
              const uiOnlySkills = p.skills.filter(
                (sk) =>
                  !diskSkillIds.has(sk.id) && !sk.id.startsWith("loaded:"),
              )
              const uiOnlyMcps = p.mcps.filter(
                (m) => !diskMcpIds.has(m.id) && !m.id.startsWith("loaded:"),
              )

              return {
                ...merged,
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description || merged.description,
                version: p.version || merged.version,
                author: p.author ?? merged.author,
                keywords: p.keywords ?? merged.keywords,
                category: p.category ?? merged.category,
                skills: [...merged.skills, ...uiOnlySkills],
                mcps: [...merged.mcps, ...uiOnlyMcps],
              }
            })
          } else {
            newPlugins = [...s.plugins, merged]
          }

          const seedCats = new Set(s.categories)
          if (merged.category?.trim()) seedCats.add(merged.category.trim())
          return { plugins: newPlugins, categories: [...seedCats] }
        })
      })

      es.addEventListener("plugin:removed", (e) => {
        if (Date.now() - get()._lastExportAt < WRITE_GUARD_MS) return

        const { slug } = JSON.parse(e.data)
        const match = (p: PluginData) =>
          p.slug === slug || p.id === `loaded:${slug}`
        set((s) => ({
          plugins: s.plugins.filter((p) => !match(p)),
          selectedPluginId:
            s.plugins.find(match)?.id === s.selectedPluginId
              ? null
              : s.selectedPluginId,
        }))
      })

      es.onerror = () => {
        set({ isPluginsLoading: false })
      }

      set({ _eventSource: es })
    })
  },

  disconnectPluginStream: () => {
    const es = get()._eventSource
    if (es) {
      es.close()
      set({ _eventSource: null })
    }
  },

  scan: async () => {
    set({ isScanning: true })
    try {
      const res = await fetch("/api/scan")
      if (!res.ok) throw new Error("Scan failed")
      const data = await res.json()
      set({
        mcpServers: data.mcpServers,
        skills: data.skills,
        agents: data.agents || [],
        isScanning: false,
      })
    } catch {
      set({ isScanning: false })
    }
  },

  setMarketplaceSettings: (patch) =>
    set((s) => {
      const { owner, metadata, ...rest } = patch
      return {
        marketplaceSettings: {
          ...s.marketplaceSettings,
          ...rest,
          owner: { ...s.marketplaceSettings.owner, ...owner },
          metadata: { ...s.marketplaceSettings.metadata, ...metadata },
        },
      }
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
    const trimmed = name.trim()
    if (!trimmed) return
    set((s) => {
      if (s.categories.includes(trimmed)) return s
      return { categories: [...s.categories, trimmed] }
    })
  },
  removeCategory: (name) =>
    set((s) => ({ categories: s.categories.filter((c) => c !== name) })),
  setSelectedPluginId: (selectedPluginId) => {
    const prev = get().selectedPluginId
    if (selectedPluginId !== prev) {
      set({ selectedPluginId, selectedItemId: null, selectedItemType: null })
    } else {
      set({ selectedPluginId })
    }
  },
  setSelectedItemInPlugin: (selectedItemId, selectedItemType) =>
    set({ selectedItemId, selectedItemType }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setSidebarSource: (sidebarSource) => set({ sidebarSource }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setRegistryQuery: (registryQuery) => set({ registryQuery }),
  setCustomRegistryQuery: (customRegistryQuery) => set({ customRegistryQuery }),
  setAutoSave: (autoSave) => {
    set({ autoSave })
    try {
      localStorage.setItem(STORAGE_KEYS.autoSave, String(autoSave))
    } catch {
      /* ignore */
    }
  },
  setExportTargets: (patch) => {
    const updated = { ...get().exportTargets, ...patch }
    set({ exportTargets: updated })
  },
  detectExportTargets: async () => {
    try {
      const res = await fetch("/api/export-targets")
      if (!res.ok) return
      const data = await res.json()
      set({
        exportTargets: {
          cursor: !!data.cursor,
          claude: !!data.claude,
          github: !!data.github,
        },
      })
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
      })
    } catch {
      /* ignore */
    }
  },

  undo: () => {
    const { _undoStack, plugins } = get()
    if (_undoStack.length === 0) return
    const prev = _undoStack[_undoStack.length - 1]
    set({
      plugins: prev,
      _undoStack: _undoStack.slice(0, -1),
      _redoStack: [...get()._redoStack, plugins],
    })
  },
  redo: () => {
    const { _redoStack, plugins } = get()
    if (_redoStack.length === 0) return
    const next = _redoStack[_redoStack.length - 1]
    set({
      plugins: next,
      _redoStack: _redoStack.slice(0, -1),
      _undoStack: [...get()._undoStack, plugins],
    })
  },
  canUndo: () => get()._undoStack.length > 0,
  canRedo: () => get()._redoStack.length > 0,

  searchRegistryMcps: async (query: string) => {
    if (query.length < 2) {
      set({
        registryMcps: [],
        registryMcpsTotal: 0,
        registryMcpsLoading: false,
      })
      return
    }
    set({ registryMcpsLoading: true })
    try {
      const url = new URL("/api/registry/mcps", window.location.origin)
      url.searchParams.set("q", query)
      url.searchParams.set("limit", "50")
      const res = await fetch(url.toString())
      const data = await res.json()
      set({
        registryMcps: data.servers || [],
        registryMcpsTotal: data.total || 0,
        registryMcpsLoading: false,
      })
    } catch {
      set({ registryMcpsLoading: false })
    }
  },

  searchRegistrySkills: async (query: string) => {
    if (query.length < 2) {
      set({ registrySkills: [], registrySkillsLoading: false })
      return
    }
    set({ registrySkillsLoading: true })
    try {
      const url = new URL("/api/registry/skills", window.location.origin)
      url.searchParams.set("q", query)
      url.searchParams.set("limit", "50")
      const res = await fetch(url.toString())
      const data = await res.json()
      set({
        registrySkills: data.skills || [],
        registrySkillsLoading: false,
      })
    } catch {
      set({ registrySkillsLoading: false })
    }
  },

  prefetchRegistry: () => {
    if (get().registryPrefetched) return
    set({ registryPrefetched: true })
  },

  fetchRegistrySkillContent: async (
    entry: RegistrySkillEntry,
  ): Promise<Skill> => {
    if (!entry.source) {
      return registrySkillToLocal(entry)
    }

    try {
      const url = new URL("/api/registry/skill-content", window.location.origin)
      url.searchParams.set("source", entry.source)
      url.searchParams.set("skill", entry.name)

      const res = await fetch(url.toString())
      const data = await res.json()

      if (!res.ok || !data.content) {
        return registrySkillToLocal(entry)
      }

      return registrySkillToLocal(entry, data.content, data.skillFiles)
    } catch {
      return registrySkillToLocal(entry)
    }
  },

  addCustomRegistry: async (rawUrl: string) => {
    const trimmed = rawUrl.trim().replace(/\/+$/, "")
    if (!trimmed) return

    const existing = get().customRegistries
    if (existing.some((r) => r.url === trimmed)) {
      sonnerToast.info("Registry already added")
      return
    }

    let hostname: string
    try {
      hostname = new URL(trimmed).hostname
    } catch {
      sonnerToast.error("Invalid URL")
      return
    }

    const entry: CustomRegistry = {
      url: trimmed,
      name: hostname,
      servers: [],
      total: 0,
      loading: true,
    }

    set({ customRegistries: [...existing, entry] })

    try {
      const url = new URL("/api/registry/custom", window.location.origin)
      url.searchParams.set("registryUrl", trimmed)
      url.searchParams.set("limit", "100")
      const res = await fetch(url.toString())
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to fetch")

      set({
        customRegistries: get().customRegistries.map((r) =>
          r.url === trimmed
            ? {
                ...r,
                servers: data.servers || [],
                total: data.total || 0,
                loading: false,
              }
            : r,
        ),
      })
      persistCustomRegistryUrls(get().customRegistries)
      sonnerToast.success(
        `Loaded ${data.servers?.length || 0} servers from ${hostname}`,
      )
    } catch (err) {
      set({
        customRegistries: get().customRegistries.map((r) =>
          r.url === trimmed
            ? {
                ...r,
                loading: false,
                error: err instanceof Error ? err.message : "Failed",
              }
            : r,
        ),
      })
      sonnerToast.error(
        `Failed to load registry: ${err instanceof Error ? err.message : "Unknown error"}`,
      )
    }
  },

  removeCustomRegistry: (url: string) => {
    set({
      customRegistries: get().customRegistries.filter((r) => r.url !== url),
    })
    persistCustomRegistryUrls(get().customRegistries)
  },

  refreshCustomRegistry: async (registryUrl: string) => {
    set({
      customRegistries: get().customRegistries.map((r) =>
        r.url === registryUrl ? { ...r, loading: true, error: undefined } : r,
      ),
    })

    try {
      const url = new URL("/api/registry/custom", window.location.origin)
      url.searchParams.set("registryUrl", registryUrl)
      const q = get().customRegistryQuery
      if (q) url.searchParams.set("q", q)
      url.searchParams.set("limit", "100")
      const res = await fetch(url.toString())
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to fetch")

      set({
        customRegistries: get().customRegistries.map((r) =>
          r.url === registryUrl
            ? {
                ...r,
                servers: data.servers || [],
                total: data.total || 0,
                loading: false,
              }
            : r,
        ),
      })
    } catch (err) {
      set({
        customRegistries: get().customRegistries.map((r) =>
          r.url === registryUrl
            ? {
                ...r,
                loading: false,
                error: err instanceof Error ? err.message : "Failed",
              }
            : r,
        ),
      })
    }
  },

  addCustomSkillRepo: async (rawUrl: string) => {
    const trimmed = rawUrl
      .trim()
      .replace(/\/+$/, "")
      .replace(/\.git$/, "")
    if (!trimmed) return

    const existing = get().customSkillRepos
    if (existing.some((r) => r.url === trimmed)) {
      sonnerToast.info("Repository already added")
      return
    }

    const entry: CustomSkillRepo = {
      url: trimmed,
      owner: "",
      repo: "",
      skills: [],
      loading: true,
    }

    set({ customSkillRepos: [...existing, entry] })

    try {
      const url = new URL("/api/registry/github-skills", window.location.origin)
      url.searchParams.set("repo", trimmed)
      const res = await fetch(url.toString())
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to fetch")

      set({
        customSkillRepos: get().customSkillRepos.map((r) =>
          r.url === trimmed
            ? {
                ...r,
                owner: data.owner || "",
                repo: data.repo || "",
                skills: data.skills || [],
                loading: false,
              }
            : r,
        ),
      })

      try {
        const urls = get().customSkillRepos.map((r) => r.url)
        localStorage.setItem(
          STORAGE_KEYS.customSkillRepos,
          JSON.stringify(urls),
        )
      } catch {}
    } catch (err) {
      set({
        customSkillRepos: get().customSkillRepos.map((r) =>
          r.url === trimmed
            ? {
                ...r,
                loading: false,
                error: err instanceof Error ? err.message : "Failed",
              }
            : r,
        ),
      })
      sonnerToast.error(
        `Failed to load skills: ${err instanceof Error ? err.message : "Unknown error"}`,
      )
    }
  },

  removeCustomSkillRepo: (repoUrl: string) => {
    set({
      customSkillRepos: get().customSkillRepos.filter((r) => r.url !== repoUrl),
    })
    try {
      const urls = get().customSkillRepos.map((r) => r.url)
      localStorage.setItem(STORAGE_KEYS.customSkillRepos, JSON.stringify(urls))
    } catch {}
  },

  refreshCustomSkillRepo: async (repoUrl: string) => {
    set({
      customSkillRepos: get().customSkillRepos.map((r) =>
        r.url === repoUrl ? { ...r, loading: true, error: undefined } : r,
      ),
    })

    try {
      const url = new URL("/api/registry/github-skills", window.location.origin)
      url.searchParams.set("repo", repoUrl)
      const res = await fetch(url.toString())
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to fetch")

      set({
        customSkillRepos: get().customSkillRepos.map((r) =>
          r.url === repoUrl
            ? {
                ...r,
                owner: data.owner || r.owner,
                repo: data.repo || r.repo,
                skills: data.skills || [],
                loading: false,
              }
            : r,
        ),
      })
    } catch (err) {
      set({
        customSkillRepos: get().customSkillRepos.map((r) =>
          r.url === repoUrl
            ? {
                ...r,
                loading: false,
                error: err instanceof Error ? err.message : "Failed",
              }
            : r,
        ),
      })
    }
  },

  addPlugin: (name, description) => {
    const state = get()
    const id = crypto.randomUUID()
    const slug = slugify(name)
    const plugin: PluginData = {
      id,
      name,
      slug,
      description,
      version: "1.0.0",
      mcps: [],
      skills: [],
      agents: [],
      ...authorFromGit(state.gitDefaults),
    }
    set({
      plugins: [...state.plugins, plugin],
      ...pushHistory(state),
    })
    return id
  },

  removePlugin: (id) => {
    const state = get()
    const plugin = state.plugins.find((p) => p.id === id)
    set({
      plugins: state.plugins.filter((p) => p.id !== id),
      selectedPluginId:
        state.selectedPluginId === id ? null : state.selectedPluginId,
      ...pushHistory(state),
    })
    if (plugin) {
      const url = new URL("/api/plugins", window.location.origin)
      url.searchParams.set("slug", plugin.slug)
      fetch(url.toString(), { method: "DELETE" }).catch(() => {})
    }
  },

  updatePlugin: (id, updates) => {
    const state = get()
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== id) return p
        const updated = { ...p, ...updates }
        if (updates.name) updated.slug = slugify(updates.name)
        return updated
      }),
      ...pushHistory(state),
    })
  },

  addMcpToPlugin: (pluginId, mcp) => {
    const state = get()
    const plugin = state.plugins.find((p) => p.id === pluginId)
    if (plugin?.mcps.some((m) => m.id === mcp.id)) return
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p
        return { ...p, mcps: [...p.mcps, mcp] }
      }),
      ...pushHistory(state),
    })
  },

  removeMcpFromPlugin: (pluginId, mcpId) => {
    const state = get()
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p
        return { ...p, mcps: p.mcps.filter((m) => m.id !== mcpId) }
      }),
      ...pushHistory(state),
    })
  },

  updateMcpInPlugin: (pluginId, mcpId, updates) => {
    const state = get()
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p
        return {
          ...p,
          mcps: p.mcps.map((m) => (m.id === mcpId ? { ...m, ...updates } : m)),
        }
      }),
      ...pushHistory(state),
    })
  },

  addSkillToPlugin: (pluginId, skill) => {
    const state = get()
    const plugin = state.plugins.find((p) => p.id === pluginId)
    if (plugin?.skills.some((s) => s.id === skill.id)) return
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p
        return { ...p, skills: [...p.skills, skill] }
      }),
      ...pushHistory(state),
    })
  },

  removeSkillFromPlugin: (pluginId, skillId) => {
    const state = get()
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p
        return { ...p, skills: p.skills.filter((s) => s.id !== skillId) }
      }),
      ...pushHistory(state),
    })
  },

  updateSkillInPlugin: (pluginId, skillId, updates) => {
    const state = get()
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p
        return {
          ...p,
          skills: p.skills.map((s) =>
            s.id === skillId ? { ...s, ...updates } : s,
          ),
        }
      }),
      ...pushHistory(state),
    })
  },

  addAgentToPlugin: (pluginId, agent) => {
    const state = get()
    const plugin = state.plugins.find((p) => p.id === pluginId)
    if (plugin?.agents?.some((a) => a.id === agent.id)) return
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p
        return { ...p, agents: [...(p.agents ?? []), agent] }
      }),
      ...pushHistory(state),
    })
  },

  removeAgentFromPlugin: (pluginId, agentId) => {
    const state = get()
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p
        return {
          ...p,
          agents: (p.agents ?? []).filter((a) => a.id !== agentId),
        }
      }),
      ...pushHistory(state),
    })
  },

  updateAgentInPlugin: (pluginId, agentId, updates) => {
    const state = get()
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p
        return {
          ...p,
          agents: (p.agents ?? []).map((a) =>
            a.id === agentId ? { ...a, ...updates } : a,
          ),
        }
      }),
      ...pushHistory(state),
    })
  },

  addHookToPlugin: (pluginId, hook) => {
    const state = get()
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p
        if ((p.hooks ?? []).some((h) => h.id === hook.id)) return p
        return { ...p, hooks: [...(p.hooks ?? []), hook] }
      }),
      ...pushHistory(state),
    })
  },

  removeHookFromPlugin: (pluginId, hookId) => {
    const state = get()
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p
        return { ...p, hooks: (p.hooks ?? []).filter((h) => h.id !== hookId) }
      }),
      ...pushHistory(state),
    })
  },

  updateHookInPlugin: (pluginId, hookId, updates) => {
    const state = get()
    set({
      plugins: state.plugins.map((p) => {
        if (p.id !== pluginId) return p
        return {
          ...p,
          hooks: (p.hooks ?? []).map((h) =>
            h.id === hookId ? { ...h, ...updates } : h,
          ),
        }
      }),
      ...pushHistory(state),
    })
  },

  setSkillImportError: (error) => set({ skillImportError: error }),

  importSkillFileToPlugin: async (pluginId: string, file: File) => {
    const placeholderId = `uploading:${Date.now()}:${file.name}`
    const baseName = file.name.replace(/\.(zip|skill)$/i, "")

    const placeholder: Skill = {
      id: placeholderId,
      name: baseName,
      description: "",
      sourceApplication: "uploaded",
      sourceFilePath: file.name,
      scope: "global",
      content: "",
      _loading: true,
    }

    set((s) => ({
      plugins: s.plugins.map((p) =>
        p.id === pluginId ? { ...p, skills: [...p.skills, placeholder] } : p,
      ),
    }))

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload-skill", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        set((s) => ({
          plugins: s.plugins.map((p) =>
            p.id === pluginId
              ? {
                  ...p,
                  skills: p.skills.filter((sk) => sk.id !== placeholderId),
                }
              : p,
          ),
          skillImportError: data.error || "Upload failed",
        }))
        return
      }

      const realSkill: Skill = {
        id: `uploaded:${Date.now()}:${data.skill.name}`,
        name: data.skill.name,
        description: data.skill.description,
        sourceApplication: "uploaded",
        sourceFilePath: file.name,
        scope: "global",
        content: data.skill.content,
        files: data.skill.skillFiles?.length
          ? data.skill.skillFiles
          : undefined,
      }

      set((s) => ({
        plugins: s.plugins.map((p) =>
          p.id === pluginId
            ? {
                ...p,
                skills: p.skills.map((sk) =>
                  sk.id === placeholderId ? realSkill : sk,
                ),
              }
            : p,
        ),
        skills: [...s.skills, realSkill],
      }))
    } catch (err) {
      set((s) => ({
        plugins: s.plugins.map((p) =>
          p.id === pluginId
            ? { ...p, skills: p.skills.filter((sk) => sk.id !== placeholderId) }
            : p,
        ),
        skillImportError:
          err instanceof Error ? err.message : "Failed to import skill",
      }))
    }
  },

  exportPlugins: async () => {
    const { plugins, marketplaceSettings, exportTargets } = get()
    if (plugins.length === 0) {
      sonnerToast.error("No plugins to export")
      return
    }

    set({ isExporting: true, _lastExportAt: Date.now() })
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plugins, marketplaceSettings, exportTargets }),
      })
      const result = await res.json()

      if (result.success) {
        set({
          isExporting: false,
          lastExport: result,
          _lastExportAt: Date.now(),
        })
        sonnerToast.success(
          `Saved ${result.pluginCount} plugins (${result.files.length} files)`,
        )
      } else {
        throw new Error(result.error || "Save failed")
      }
    } catch (error) {
      set({ isExporting: false })
      sonnerToast.error(error instanceof Error ? error.message : "Save failed")
    }
  },

  silentExport: async () => {
    const { plugins, marketplaceSettings, exportTargets, isExporting } = get()
    if (plugins.length === 0 || isExporting) return
    set({ _lastExportAt: Date.now() })
    try {
      await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plugins, marketplaceSettings, exportTargets }),
      })
      set({ _lastExportAt: Date.now() })
    } catch {
      // silent
    }
  },
}))
