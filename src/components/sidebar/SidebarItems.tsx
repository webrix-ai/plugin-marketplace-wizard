"use client"

import { useState, useMemo } from "react"
import {
  Globe,
  FolderOpen,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import {
  registryMcpToLocal,
  registrySkillToLocal,
} from "@/lib/services/registry"
import { cn, truncate, parseSkillFrontmatter } from "@/lib/utils"
import type {
  McpServer,
  Skill,
  AgentData,
  DragPayload,
  RegistryMcpServer,
  RegistrySkillEntry,
  CustomGitHubSkill,
} from "@/lib/types"
import McpLogo from "@/components/logo/McpLogo"
import SkillLogo from "@/components/logo/SkillLogo"
import AgentLogo from "@/components/logo/AgentLogo"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"

export function McpItem({
  mcp,
  usageCount,
  onSelect,
}: {
  mcp: McpServer
  usageCount: number
  onSelect: () => void
}) {
  const handleDragStart = (e: React.DragEvent) => {
    const payload: DragPayload = { type: "mcp", item: mcp }
    e.dataTransfer.setData("application/json", JSON.stringify(payload))
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className="group flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all hover:border-emerald-500/20 hover:bg-emerald-500/5 active:cursor-grabbing"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
        <McpLogo color="#34d399" className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{mcp.name}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">
            {mcp.sourceApplication}
          </span>
          {mcp.scope === "global" ? (
            <Globe className="size-2.5 text-muted-foreground" />
          ) : (
            <FolderOpen className="size-2.5 text-muted-foreground" />
          )}
        </div>
      </div>
      {usageCount > 0 ? (
        <Badge variant="secondary" className="h-4 text-[9px] text-emerald-500">
          {usageCount}
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="h-4 text-[9px] opacity-0 transition group-hover:opacity-100"
        >
          Drag
        </Badge>
      )}
    </div>
  )
}

export function SkillItem({
  skill,
  usageCount,
  onSelect,
}: {
  skill: Skill
  usageCount: number
  onSelect: () => void
}) {
  const handleDragStart = (e: React.DragEvent) => {
    const payload: DragPayload = { type: "skill", item: skill }
    e.dataTransfer.setData("application/json", JSON.stringify(payload))
    e.dataTransfer.effectAllowed = "copy"
  }

  const { frontmatter } = useMemo(
    () => parseSkillFrontmatter(skill.content),
    [skill.content],
  )
  const displayName = frontmatter.name || skill.name
  const displayDesc = frontmatter.description || skill.description

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className="group flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all hover:border-violet-500/20 hover:bg-violet-500/5 active:cursor-grabbing"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10">
        <SkillLogo size={16} color="#a78bfa" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{displayName}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {displayDesc ? truncate(displayDesc, 40) : skill.sourceApplication}
        </p>
      </div>
      {usageCount > 0 ? (
        <Badge variant="secondary" className="h-4 text-[9px] text-violet-500">
          {usageCount}
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="h-4 text-[9px] opacity-0 transition group-hover:opacity-100"
        >
          Drag
        </Badge>
      )}
    </div>
  )
}

export function AgentItem({
  agent,
  usageCount,
  onSelect,
}: {
  agent: AgentData
  usageCount: number
  onSelect: () => void
}) {
  const handleDragStart = (e: React.DragEvent) => {
    const payload: DragPayload = { type: "agent", item: agent }
    e.dataTransfer.setData("application/json", JSON.stringify(payload))
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className="group flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all hover:border-blue-500/20 hover:bg-blue-500/5 active:cursor-grabbing"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
        <AgentLogo size={16} color="#3b82f6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{agent.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {agent.description ? truncate(agent.description, 40) : agent.scope}
        </p>
      </div>
      {usageCount > 0 ? (
        <Badge variant="secondary" className="h-4 text-[9px] text-blue-500">
          {usageCount}
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="h-4 text-[9px] opacity-0 transition group-hover:opacity-100"
        >
          Drag
        </Badge>
      )}
    </div>
  )
}

export function SkeletonItem() {
  return (
    <div className="flex animate-pulse items-center gap-2.5 rounded-lg px-2.5 py-2">
      <div className="size-7 shrink-0 rounded-md bg-muted" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-2.5 w-16 rounded bg-muted" />
      </div>
    </div>
  )
}

export function RegistryMcpItem({
  server,
  onSelect,
}: {
  server: RegistryMcpServer
  onSelect: () => void
}) {
  const handleDragStart = (e: React.DragEvent) => {
    const localMcp = registryMcpToLocal(server)
    const payload: DragPayload = { type: "mcp", item: localMcp }
    e.dataTransfer.setData("application/json", JSON.stringify(payload))
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className="group flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all hover:border-emerald-500/20 hover:bg-emerald-500/5 active:cursor-grabbing"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
        <McpLogo color="#34d399" className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">
          {server.title || server.name}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">
          {server.description
            ? truncate(server.description, 50)
            : "MCP Registry"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {server.websiteUrl && (
          <a
            href={server.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="nodrag rounded p-0.5 text-muted-foreground transition hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="size-3" />
          </a>
        )}
        <Badge
          variant="outline"
          className="h-4 text-[9px] opacity-0 transition group-hover:opacity-100"
        >
          Drag
        </Badge>
      </div>
    </div>
  )
}

export function RegistrySkillItem({
  entry,
  onSelect,
}: {
  entry: RegistrySkillEntry
  onSelect: () => void
}) {
  const handleDragStart = (e: React.DragEvent) => {
    const localSkill = registrySkillToLocal(entry)
    localSkill._registryEntry = entry
    const payload: DragPayload = { type: "skill", item: localSkill }
    e.dataTransfer.setData("application/json", JSON.stringify(payload))
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className="group flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all hover:border-violet-500/20 hover:bg-violet-500/5 active:cursor-grabbing"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10">
        <SkillLogo size={16} color="#a78bfa" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{entry.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {entry.source} · {entry.installs.toLocaleString()} installs
        </p>
      </div>
      <Badge
        variant="outline"
        className="h-4 text-[9px] opacity-0 transition group-hover:opacity-100"
      >
        Drag
      </Badge>
    </div>
  )
}

export function CustomGitHubSkillItem({
  skill,
  onSelect,
}: {
  skill: CustomGitHubSkill
  onSelect: () => void
}) {
  const handleDragStart = (e: React.DragEvent) => {
    const localSkill: Skill = {
      id: `github:${skill.source}:${skill.dirName}`,
      name: skill.name,
      description: skill.description,
      sourceApplication: "github",
      sourceFilePath: `${skill.repository}/tree/HEAD/skills/${skill.dirName}`,
      scope: "global",
      content: skill.content,
      files: skill.files?.length ? skill.files : undefined,
    }
    const payload: DragPayload = { type: "skill", item: localSkill }
    e.dataTransfer.setData("application/json", JSON.stringify(payload))
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className="group flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all hover:border-violet-500/20 hover:bg-violet-500/5 active:cursor-grabbing"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10">
        <SkillLogo size={16} color="#a78bfa" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{skill.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {skill.description ? truncate(skill.description, 40) : skill.source}
        </p>
      </div>
      <Badge
        variant="outline"
        className="h-4 text-[9px] opacity-0 transition group-hover:opacity-100"
      >
        Drag
      </Badge>
    </div>
  )
}

export function CollapsibleSection({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string
  count: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-1.5 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground">
        {open ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
        {title}
        <Badge variant="secondary" className="ml-auto h-4 text-[9px]">
          {count >= 0 ? count : "..."}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-0.5 px-1.5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
