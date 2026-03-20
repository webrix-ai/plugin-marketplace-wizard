"use client";

import { useMemo } from "react";
import { Search, Package } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import type { DetailItem } from "@/components/DetailPanel";
import McpLogo from "@/components/logo/McpLogo";
import SkillLogo from "@/components/logo/SkillLogo";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { McpItem, SkillItem, SkeletonItem, CollapsibleSection } from "./SidebarItems";

export function LocalContent({ onSelectItem }: { onSelectItem: (item: DetailItem) => void }) {
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

  const pluginContents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return plugins
      .map((p) => {
        const mcps = p.mcps.filter(
          (m) => !q || m.name.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
        );
        const pSkills = p.skills.filter(
          (s) =>
            !q ||
            s.name.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q)
        );
        return { plugin: p, mcps, skills: pSkills };
      })
      .filter((e) => e.mcps.length > 0 || e.skills.length > 0);
  }, [plugins, searchQuery]);

  const totalPluginItems = pluginContents.reduce(
    (sum, e) => sum + e.mcps.length + e.skills.length,
    0
  );

  return (
    <>
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter MCPs & skills..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isScanning && (
          <div className="flex flex-col gap-1 px-1.5 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonItem key={i} />
            ))}
          </div>
        )}

        {!isScanning && mcpServers.length === 0 && skills.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <McpLogo color="currentColor" className="size-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No items found</p>
            <p className="text-[10px] text-muted-foreground/70">
              Configure MCP servers or skills in your IDE
            </p>
          </div>
        )}

        {!isScanning && (filteredMcps.length > 0 || filteredSkills.length > 0) && (
          <div className="flex flex-col gap-1">
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

        {!isScanning && pluginContents.length > 0 && (
          <div className="flex flex-col gap-1 border-t pt-1 mt-1">
            <CollapsibleSection
              title="Plugin Contents"
              count={totalPluginItems}
              defaultOpen={false}
            >
              {pluginContents.map(({ plugin, mcps, skills: pSkills }) => (
                <div key={plugin.id} className="mb-2">
                  <div className="flex items-center gap-1.5 px-1 py-1">
                    <Package className="size-3 text-muted-foreground" />
                    <span className="truncate text-[10px] font-semibold text-muted-foreground">
                      {plugin.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="ml-auto h-4 text-[9px]"
                    >
                      {mcps.length + pSkills.length}
                    </Badge>
                  </div>
                  {mcps.map((mcp) => (
                    <div
                      key={mcp.id}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition hover:bg-emerald-500/5 cursor-pointer"
                      onClick={() => onSelectItem({ kind: "mcp", data: mcp })}
                    >
                      <div className="flex size-5 shrink-0 items-center justify-center rounded bg-emerald-500/10">
                        <McpLogo color="#34d399" className="size-3" />
                      </div>
                      <span className="truncate text-[11px]">{mcp.name}</span>
                      <span className="ml-auto text-[9px] text-muted-foreground">
                        {mcp.config.type || "stdio"}
                      </span>
                    </div>
                  ))}
                  {pSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition hover:bg-violet-500/5 cursor-pointer"
                      onClick={() =>
                        onSelectItem({ kind: "skill", data: skill })
                      }
                    >
                      <div className="flex size-5 shrink-0 items-center justify-center rounded bg-violet-500/10">
                        <SkillLogo size={12} color="#a78bfa" />
                      </div>
                      <span className="truncate text-[11px]">{skill.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </CollapsibleSection>
          </div>
        )}

      </div>
    </>
  );
}
