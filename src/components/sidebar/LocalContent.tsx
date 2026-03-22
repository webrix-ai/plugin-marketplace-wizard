"use client"

import { useMemo } from "react"
import { Search, Bot } from "lucide-react"
import { useWizardStore } from "@/lib/store"
import type { DetailItem } from "@/components/DetailPanel"
import McpLogo from "@/components/logo/McpLogo"
import SkillLogo from "@/components/logo/SkillLogo"
import { Input } from "@/components/ui/input"
import { McpItem, SkillItem, AgentItem, SkeletonItem } from "./SidebarItems"

export function LocalContent({
  tab,
  onSelectItem,
}: {
  tab: "mcps" | "skills" | "agents"
  onSelectItem: (item: DetailItem) => void
}) {
  const {
    mcpServers,
    skills,
    agents,
    plugins,
    searchQuery,
    setSearchQuery,
    isScanning,
  } = useWizardStore()

  const mcpUsage = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of plugins) {
      for (const m of p.mcps) {
        counts.set(m.id, (counts.get(m.id) || 0) + 1)
      }
    }
    return counts
  }, [plugins])

  const skillUsage = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of plugins) {
      for (const s of p.skills) {
        counts.set(s.id, (counts.get(s.id) || 0) + 1)
      }
    }
    return counts
  }, [plugins])

  const agentUsage = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of plugins) {
      for (const a of p.agents ?? []) {
        counts.set(a.id, (counts.get(a.id) || 0) + 1)
      }
    }
    return counts
  }, [plugins])

  const filteredMcps = mcpServers.filter(
    (m) =>
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sourceApplication.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredSkills = skills.filter(
    (s) =>
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sourceApplication.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredAgents = agents.filter(
    (a) =>
      !searchQuery ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const placeholder =
    tab === "mcps"
      ? "Filter MCP servers..."
      : tab === "skills"
        ? "Filter skills..."
        : "Filter agents..."

  return (
    <>
      <div className="p-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
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

        {!isScanning && tab === "mcps" && mcpServers.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <McpLogo
              color="currentColor"
              className="size-6 text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              No MCP servers found
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              Configure MCP servers in your IDE
            </p>
          </div>
        )}

        {!isScanning && tab === "skills" && skills.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <SkillLogo
              size={24}
              color="currentColor"
              className="text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">No skills found</p>
            <p className="text-[10px] text-muted-foreground/70">
              Configure skills in your IDE
            </p>
          </div>
        )}

        {!isScanning && tab === "agents" && agents.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <Bot className="size-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No agents found</p>
            <p className="text-[10px] text-muted-foreground/70">
              Add agents to ~/.claude/agents/
            </p>
          </div>
        )}

        {!isScanning && tab === "mcps" && filteredMcps.length > 0 && (
          <div className="flex flex-col gap-0.5 px-1.5">
            {filteredMcps.map((mcp) => (
              <McpItem
                key={mcp.id}
                mcp={mcp}
                usageCount={mcpUsage.get(mcp.id) || 0}
                onSelect={() => onSelectItem({ kind: "mcp", data: mcp })}
              />
            ))}
          </div>
        )}

        {!isScanning && tab === "skills" && filteredSkills.length > 0 && (
          <div className="flex flex-col gap-0.5 px-1.5">
            {filteredSkills.map((skill) => (
              <SkillItem
                key={skill.id}
                skill={skill}
                usageCount={skillUsage.get(skill.id) || 0}
                onSelect={() => onSelectItem({ kind: "skill", data: skill })}
              />
            ))}
          </div>
        )}

        {!isScanning && tab === "agents" && filteredAgents.length > 0 && (
          <div className="flex flex-col gap-0.5 px-1.5">
            {filteredAgents.map((agent) => (
              <AgentItem
                key={agent.id}
                agent={agent}
                usageCount={agentUsage.get(agent.id) || 0}
                onSelect={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
