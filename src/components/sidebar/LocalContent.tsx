"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import type { DetailItem } from "@/components/DetailPanel";
import McpLogo from "@/components/logo/McpLogo";
import { Input } from "@/components/ui/input";
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
      </div>
    </>
  );
}
