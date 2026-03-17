"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Globe,
  FolderOpen,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Monitor,
} from "lucide-react";
import {
  useWizardStore,
  registryMcpToLocal,
  registrySkillToLocal,
  type RegistrySkillEntry,
} from "@/lib/store";
import { cn, truncate } from "@/lib/utils";
import type { McpServer, Skill, DragPayload, RegistryMcpServer } from "@/lib/types";
import { DetailPanel, type DetailItem } from "./DetailPanel";
import McpLogo from "./logo/McpLogo";
import SkillLogo from "./logo/SkillLogo";

// --- Local items ---

function McpItem({
  mcp,
  usageCount,
  onSelect,
}: {
  mcp: McpServer;
  usageCount: number;
  onSelect: () => void;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    const payload: DragPayload = { type: "mcp", item: mcp };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className="group flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all hover:border-emerald-500/20 hover:bg-emerald-500/[0.06] active:cursor-grabbing"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
        <McpLogo color="#34d399" className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-200">
          {mcp.name}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500">{mcp.sourceApplication}</span>
          {mcp.scope === "global" ? (
            <Globe className="h-2.5 w-2.5 text-slate-600" />
          ) : (
            <FolderOpen className="h-2.5 w-2.5 text-slate-600" />
          )}
        </div>
      </div>
      {usageCount > 0 ? (
        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400/80">
          {usageCount}
        </span>
      ) : (
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400/70 opacity-0 transition group-hover:opacity-100">
          Drag
        </span>
      )}
    </div>
  );
}

function SkillItem({
  skill,
  usageCount,
  onSelect,
}: {
  skill: Skill;
  usageCount: number;
  onSelect: () => void;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    const payload: DragPayload = { type: "skill", item: skill };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className="group flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all hover:border-violet-500/20 hover:bg-violet-500/[0.06] active:cursor-grabbing"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10">
        <SkillLogo size={16} color="#a78bfa" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-200">
          {skill.name}
        </p>
        <p className="truncate text-[10px] text-slate-500">
          {skill.description ? truncate(skill.description, 40) : skill.sourceApplication}
        </p>
      </div>
      {usageCount > 0 ? (
        <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-medium text-violet-400/80">
          {usageCount}
        </span>
      ) : (
        <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-medium text-violet-400/70 opacity-0 transition group-hover:opacity-100">
          Drag
        </span>
      )}
    </div>
  );
}

// --- Registry items ---

function RegistryMcpItem({
  server,
  onSelect,
}: {
  server: RegistryMcpServer;
  onSelect: () => void;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    const localMcp = registryMcpToLocal(server);
    const payload: DragPayload = { type: "mcp", item: localMcp };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className="group flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all hover:border-emerald-500/20 hover:bg-emerald-500/[0.06] active:cursor-grabbing"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
        <McpLogo color="#34d399" className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-200">
          {server.title || server.name}
        </p>
        <p className="truncate text-[10px] text-slate-500">
          {server.description ? truncate(server.description, 50) : "MCP Registry"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {server.websiteUrl && (
          <a
            href={server.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="nodrag rounded p-0.5 text-slate-600 transition hover:text-slate-400"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400/70 opacity-0 transition group-hover:opacity-100">
          Drag
        </span>
      </div>
    </div>
  );
}

function RegistrySkillItem({
  entry,
  onSelect,
}: {
  entry: RegistrySkillEntry;
  onSelect: () => void;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    const localSkill = registrySkillToLocal(entry);
    const payload: DragPayload = { type: "skill", item: localSkill };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className="group flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all hover:border-violet-500/20 hover:bg-violet-500/[0.06] active:cursor-grabbing"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10">
        <SkillLogo size={16} color="#a78bfa" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-200">
          {entry.name}
        </p>
        <p className="truncate text-[10px] text-slate-500">
          {entry.source} · {entry.installs.toLocaleString()} installs
        </p>
      </div>
      <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-medium text-violet-400/70 opacity-0 transition group-hover:opacity-100">
        Drag
      </span>
    </div>
  );
}

// --- Shared ---

function CollapsibleSection({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 transition hover:text-slate-400"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {title}
        <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium">
          {count}
        </span>
      </button>
      {open && <div className="space-y-0.5 px-1.5">{children}</div>}
    </div>
  );
}

// --- Source toggle ---

function SourceToggle({
  source,
  onChange,
}: {
  source: "local" | "registry";
  onChange: (s: "local" | "registry") => void;
}) {
  return (
    <div className="flex rounded-lg bg-white/[0.03] p-0.5">
      <button
        onClick={() => onChange("local")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition",
          source === "local"
            ? "bg-white/[0.08] text-white shadow-sm"
            : "text-slate-500 hover:text-slate-400"
        )}
      >
        <Monitor className="h-3 w-3" />
        Local
      </button>
      <button
        onClick={() => onChange("registry")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition",
          source === "registry"
            ? "bg-white/[0.08] text-white shadow-sm"
            : "text-slate-500 hover:text-slate-400"
        )}
      >
        <Globe className="h-3 w-3" />
        Registry
      </button>
    </div>
  );
}

// --- Local content ---

function LocalContent({ onSelectItem }: { onSelectItem: (item: DetailItem) => void }) {
  const { mcpServers, skills, plugins, searchQuery, setSearchQuery, isScanning } =
    useWizardStore();

  const mcpUsage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of plugins) {
      for (const m of p.mcps) {
        counts.set(m.id, (counts.get(m.id) || 0) + 1);
      }
    }
    return counts;
  }, [plugins]);

  const skillUsage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of plugins) {
      for (const s of p.skills) {
        counts.set(s.id, (counts.get(s.id) || 0) + 1);
      }
    }
    return counts;
  }, [plugins]);

  const filteredMcps = mcpServers.filter(
    (m) =>
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sourceApplication.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSkills = skills.filter(
    (s) =>
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sourceApplication.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 py-2">
          <Search className="h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter MCPs & skills..."
            className="w-full bg-transparent text-xs text-slate-300 outline-none placeholder:text-slate-600"
          />
        </div>
      </div>

      <div
        className={cn(
          "flex-1 overflow-y-auto",
          isScanning && "pointer-events-none opacity-50"
        )}
      >
        {isScanning && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            <p className="text-xs text-slate-500">Scanning your system...</p>
          </div>
        )}

        {!isScanning && mcpServers.length === 0 && skills.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <McpLogo color="#475569" className="h-6 w-6" />
            <p className="text-xs text-slate-400">No items found</p>
            <p className="text-[10px] text-slate-600">
              Configure MCP servers or skills in your IDE
            </p>
          </div>
        )}

        {!isScanning && (filteredMcps.length > 0 || filteredSkills.length > 0) && (
          <div className="space-y-1">
            {filteredMcps.length > 0 && (
              <CollapsibleSection title="MCPs" count={filteredMcps.length}>
                {filteredMcps.map((mcp) => (
                  <McpItem
                    key={mcp.id}
                    mcp={mcp}
                    usageCount={mcpUsage.get(mcp.id) || 0}
                    onSelect={() => onSelectItem({ kind: "mcp", data: mcp })}
                  />
                ))}
              </CollapsibleSection>
            )}
            {filteredSkills.length > 0 && (
              <CollapsibleSection title="Skills" count={filteredSkills.length}>
                {filteredSkills.map((skill) => (
                  <SkillItem
                    key={skill.id}
                    skill={skill}
                    usageCount={skillUsage.get(skill.id) || 0}
                    onSelect={() => onSelectItem({ kind: "skill", data: skill })}
                  />
                ))}
              </CollapsibleSection>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// --- Registry content ---

function RegistryContent({ onSelectItem }: { onSelectItem: (item: DetailItem) => void }) {
  const {
    registryMcps,
    registryMcpsTotal,
    registryMcpsLoading,
    registrySkills,
    registrySkillsLoading,
    registryQuery,
    setRegistryQuery,
    searchRegistryMcps,
    searchRegistrySkills,
  } = useWizardStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      searchRegistryMcps("");
    }
  }, [searchRegistryMcps]);

  const handleSearch = useCallback(
    (value: string) => {
      setRegistryQuery(value);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        searchRegistryMcps(value);
        searchRegistrySkills(value);
      }, 350);
    },
    [setRegistryQuery, searchRegistryMcps, searchRegistrySkills]
  );

  return (
    <>
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 py-2">
          <Search className="h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={registryQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search MCP registry & skills.sh..."
            className="w-full bg-transparent text-xs text-slate-300 outline-none placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto">
        <CollapsibleSection
          title="MCP Registry"
          count={registryMcpsLoading ? -1 : registryMcps.length}
        >
          {registryMcpsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              <span className="ml-2 text-[11px] text-slate-500">Loading registry...</span>
            </div>
          ) : registryMcps.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-[11px] text-slate-500">
                {registryQuery ? "No MCPs match your search" : "Loading MCP servers..."}
              </p>
            </div>
          ) : (
            <>
              {registryMcps.map((server) => (
                <RegistryMcpItem
                  key={server.name + server.version}
                  server={server}
                  onSelect={() => onSelectItem({ kind: "registry-mcp", data: server })}
                />
              ))}
              {registryMcpsTotal > registryMcps.length && (
                <p className="px-3 py-1.5 text-center text-[10px] text-slate-600">
                  Showing {registryMcps.length} of {registryMcpsTotal}
                </p>
              )}
            </>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Skills.sh"
          count={registrySkillsLoading ? -1 : registrySkills.length}
        >
          {registrySkillsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
              <span className="ml-2 text-[11px] text-slate-500">Searching skills...</span>
            </div>
          ) : registrySkills.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-[11px] text-slate-500">
                {registryQuery ? "No skills match your search" : "Type to search skills.sh"}
              </p>
            </div>
          ) : (
            registrySkills.map((entry) => (
              <RegistrySkillItem
                key={entry.id}
                entry={entry}
                onSelect={() => onSelectItem({ kind: "registry-skill", data: entry })}
              />
            ))
          )}
        </CollapsibleSection>
      </div>
    </>
  );
}

// --- Main sidebar ---

export function Sidebar() {
  const { sidebarSource, setSidebarSource } = useWizardStore();
  const [selectedItem, setSelectedItem] = useState<DetailItem | null>(null);

  return (
    <aside className="relative flex w-72 shrink-0 flex-col border-r border-white/[0.06] bg-[#0d1017]">
      <div className="space-y-2 border-b border-white/[0.06] p-3">
        <SourceToggle source={sidebarSource} onChange={setSidebarSource} />
      </div>

      {sidebarSource === "local" ? (
        <LocalContent onSelectItem={setSelectedItem} />
      ) : (
        <RegistryContent onSelectItem={setSelectedItem} />
      )}

      <div className="border-t border-white/[0.06] px-3 py-2.5">
        <p className="text-center text-[10px] text-slate-600">
          {sidebarSource === "local"
            ? "Click to inspect · Drag to add to plugins"
            : "Click to inspect · Drag to add to plugins"}
        </p>
      </div>

      {selectedItem && (
        <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </aside>
  );
}
