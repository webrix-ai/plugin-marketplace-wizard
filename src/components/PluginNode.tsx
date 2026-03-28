"use client"

import { useState, useCallback, useMemo, memo } from "react"
import type { NodeProps, Node } from "@xyflow/react"
import { X, Trash2, GripVertical, Loader2, AlertCircle } from "lucide-react"
import { useWizardStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { NodeStatusIndicator } from "@/components/node-status-indicator"
import McpLogo from "./logo/McpLogo"
import SkillLogo from "./logo/SkillLogo"
import AgentLogo from "./logo/AgentLogo"
import {
  validatePluginData,
  validateMcpServer,
  validateSkill,
  validateAgent,
  getSkillDirName,
} from "@/lib/validate-marketplace"
import type {
  PluginData,
  DragPayload,
  RegistrySkillEntry,
  PluginHook,
} from "@/lib/types"
import { Webhook } from "lucide-react"

const SKILL_FILE_EXTENSIONS = [".zip", ".skill"]
function isSkillFile(name: string) {
  const lower = name.toLowerCase()
  return SKILL_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export type PluginNodeType = Node<PluginData, "plugin">

function PluginNodeComponent({ data, id }: NodeProps<PluginNodeType>) {
  const {
    removePlugin,
    addMcpToPlugin,
    addSkillToPlugin,
    updateSkillInPlugin,
    removeMcpFromPlugin,
    removeSkillFromPlugin,
    addAgentToPlugin,
    removeAgentFromPlugin,
    addHookToPlugin,
    removeHookFromPlugin,
    setSelectedPluginId,
    selectedPluginId,
    setSelectedItemInPlugin,
    selectedItemId,
    fetchRegistrySkillContent,
    importSkillFileToPlugin,
  } = useWizardStore()

  const [isOver, setIsOver] = useState(false)

  const isSelected = selectedPluginId === id

  const hasLoadingSkills = data.skills.some((s) => !!s._loading)

  const validationIssues = useMemo(() => validatePluginData(data), [data])
  const errors = useMemo(
    () => validationIssues.filter((i) => i.severity !== "warning"),
    [validationIssues],
  )

  const nodeStatus = hasLoadingSkills
    ? ("loading" as const)
    : errors.length > 0
      ? ("error" as const)
      : undefined

  const tooltipSummary = useMemo(() => {
    if (validationIssues.length === 0) return ""
    const lines = validationIssues.map(
      (i) => `${i.severity === "warning" ? "⚠" : "✕"} ${i.message}`,
    )
    return lines.join("\n")
  }, [validationIssues])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "copy"
    setIsOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation()
    if (
      (e.currentTarget as HTMLElement).contains(e.relatedTarget as HTMLElement)
    )
      return
    setIsOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsOver(false)

      const files = e.dataTransfer.files
      if (files.length > 0 && isSkillFile(files[0].name)) {
        importSkillFileToPlugin(id, files[0])
        return
      }

      try {
        const raw = e.dataTransfer.getData("application/json")
        if (!raw) return
        const payload: DragPayload = JSON.parse(raw)

        if (payload.type === "mcp") {
          addMcpToPlugin(id, payload.item as PluginData["mcps"][0])
        } else if (payload.type === "agent") {
          addAgentToPlugin(
            id,
            payload.item as NonNullable<PluginData["agents"]>[0],
          )
        } else if (payload.type === "hook") {
          addHookToPlugin(id, payload.item as PluginHook)
        } else {
          const skill = payload.item as PluginData["skills"][0]
          addSkillToPlugin(id, skill)

          if (skill._registryEntry) {
            fetchRegistrySkillContent(
              skill._registryEntry as RegistrySkillEntry,
            ).then((fullSkill) => {
              updateSkillInPlugin(id, skill.id, {
                content: fullSkill.content,
                description: fullSkill.description,
                sourceFilePath: fullSkill.sourceFilePath,
                files: fullSkill.files,
              })
            })
          }
        }
      } catch {
        // invalid drag data
      }
    },
    [
      id,
      addMcpToPlugin,
      addSkillToPlugin,
      addAgentToPlugin,
      addHookToPlugin,
      fetchRegistrySkillContent,
      updateSkillInPlugin,
      importSkillFileToPlugin,
    ],
  )

  const handleClick = useCallback(() => {
    if (isSelected) {
      setSelectedPluginId(null)
    } else {
      setSelectedPluginId(id)
    }
  }, [id, isSelected, setSelectedPluginId])

  const totalItems =
    data.mcps.length +
    data.skills.length +
    (data.agents?.length ?? 0) +
    (data.hooks?.length ?? 0)

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <NodeStatusIndicator status={nodeStatus} variant="border">
        <Card
          size="sm"
          className={cn(
            "w-[320px] cursor-pointer transition-all",
            isSelected
              ? "ring-2 ring-primary/50"
              : isOver
                ? "ring-2 ring-primary/40"
                : "hover:ring-1 hover:ring-foreground/10",
          )}
        >
          <CardHeader className="gap-2 border-b">
            <div className="flex items-start gap-2">
              <div className="cursor-grab pt-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing">
                <GripVertical className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{data.name}</h3>
                {data.description && (
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {data.description}
                  </p>
                )}
              </div>

              {validationIssues.length > 0 && (
                <span
                  title={tooltipSummary}
                  className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-md",
                    errors.length > 0 ? "text-red-500" : "text-amber-500",
                  )}
                >
                  <AlertCircle className="size-3.5" />
                </span>
              )}

              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  removePlugin(id)
                }}
                className="nodrag size-5 opacity-0 hover:text-destructive [div:hover>&]:opacity-100"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-1">
            {data.mcps.length > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-500/80">
                  <McpLogo color="currentColor" className="size-3" />
                  MCP Servers
                </p>
                <div className="flex flex-col gap-0.5">
                  {data.mcps.map((mcp) => {
                    const mcpIssues = validateMcpServer(mcp)
                    const mcpHasErrors = mcpIssues.some(
                      (i) => i.severity !== "warning",
                    )
                    return (
                      <div
                        key={mcp.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isSelected) setSelectedPluginId(id)
                          setSelectedItemInPlugin(mcp.id, "mcp")
                        }}
                        className={cn(
                          "nodrag group/item flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-accent",
                          isSelected &&
                            selectedItemId === mcp.id &&
                            "bg-emerald-500/10 ring-1 ring-emerald-500/30",
                        )}
                      >
                        {mcpIssues.length > 0 ? (
                          <AlertCircle
                            className={cn(
                              "size-3 shrink-0",
                              mcpHasErrors ? "text-red-500" : "text-amber-500",
                            )}
                          />
                        ) : (
                          <div className="size-1.5 rounded-full bg-emerald-500/60" />
                        )}
                        <span className="flex-1 truncate text-[11px]">
                          {mcp.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeMcpFromPlugin(id, mcp.id)
                          }}
                          className="size-4 opacity-0 hover:text-destructive group-hover/item:opacity-100"
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {data.skills.length > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-violet-500/80">
                  <SkillLogo size={12} color="currentColor" />
                  Skills
                </p>
                <div className="flex flex-col gap-0.5">
                  {data.skills.map((skill) => {
                    const loading = !!skill._loading
                    const skillIssues = loading ? [] : validateSkill(skill)
                    const skillHasErrors = skillIssues.some(
                      (i) => i.severity !== "warning",
                    )
                    const dir = getSkillDirName(skill)
                    const namesDiffer = dir && dir !== skill.name?.trim()
                    return (
                      <div
                        key={skill.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (loading) return
                          if (!isSelected) setSelectedPluginId(id)
                          setSelectedItemInPlugin(skill.id, "skill")
                        }}
                        className={cn(
                          "nodrag group/item flex items-center gap-2 rounded-lg px-2 py-1.5 transition",
                          loading
                            ? "opacity-45"
                            : "cursor-pointer hover:bg-accent",
                          !loading &&
                            isSelected &&
                            selectedItemId === skill.id &&
                            "bg-violet-500/10 ring-1 ring-violet-500/30",
                        )}
                      >
                        {loading ? (
                          <Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" />
                        ) : skillIssues.length > 0 ? (
                          <AlertCircle
                            className={cn(
                              "size-3 shrink-0",
                              skillHasErrors
                                ? "text-red-500"
                                : "text-amber-500",
                            )}
                          />
                        ) : (
                          <div className="size-1.5 rounded-full bg-violet-500/60" />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-[11px]">
                            {skill.name}
                          </span>
                          {namesDiffer && (
                            <span className="block truncate font-mono text-[9px] text-muted-foreground">
                              {dir}/
                            </span>
                          )}
                        </div>
                        {!loading && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeSkillFromPlugin(id, skill.id)
                            }}
                            className="size-4 opacity-0 hover:text-destructive group-hover/item:opacity-100"
                          >
                            <X className="size-3" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {(data.agents?.length ?? 0) > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-blue-500/80">
                  <AgentLogo size={12} color="currentColor" />
                  Agents
                </p>
                <div className="flex flex-col gap-0.5">
                  {data.agents!.map((agent) => {
                    const agentIssues = validateAgent(agent)
                    const agentHasErrors = agentIssues.some(
                      (i) => i.severity !== "warning",
                    )
                    return (
                      <div
                        key={agent.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isSelected) setSelectedPluginId(id)
                          setSelectedItemInPlugin(agent.id, "agent")
                        }}
                        className={cn(
                          "nodrag group/item flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-accent",
                          isSelected &&
                            selectedItemId === agent.id &&
                            "bg-blue-500/10 ring-1 ring-blue-500/30",
                        )}
                      >
                        {agentIssues.length > 0 ? (
                          <AlertCircle
                            className={cn(
                              "size-3 shrink-0",
                              agentHasErrors
                                ? "text-red-500"
                                : "text-amber-500",
                            )}
                          />
                        ) : (
                          <div className="size-1.5 rounded-full bg-blue-500/60" />
                        )}
                        <span className="flex-1 truncate text-[11px]">
                          {agent.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeAgentFromPlugin(id, agent.id)
                          }}
                          className="size-4 opacity-0 hover:text-destructive group-hover/item:opacity-100"
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {(data.hooks?.length ?? 0) > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-orange-500/80">
                  <Webhook className="size-3" />
                  Hooks
                </p>
                <div className="flex flex-col gap-0.5">
                  {data.hooks!.map((hook) => (
                    <div
                      key={hook.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isSelected) setSelectedPluginId(id)
                        setSelectedItemInPlugin(hook.id, "hook")
                      }}
                      className={cn(
                        "nodrag group/item flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-accent",
                        isSelected &&
                          selectedItemId === hook.id &&
                          "bg-orange-500/10 ring-1 ring-orange-500/30",
                      )}
                    >
                      <div className="size-1.5 rounded-full bg-orange-500/60" />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-[11px]">
                          {hook.event}
                        </span>
                        <span className="block truncate font-mono text-[9px] text-muted-foreground">
                          {hook.platform} · {hook.handlerType}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeHookFromPlugin(id, hook.id)
                        }}
                        className="size-4 opacity-0 hover:text-destructive group-hover/item:opacity-100"
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalItems === 0 && !isOver && (
              <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed py-6 text-center">
                <p className="text-[11px] text-muted-foreground">
                  Drop MCPs & skills here
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  or drag from the sidebar
                </p>
              </div>
            )}

            {isOver && (
              <div className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 py-3 text-center">
                <span className="text-[11px] font-medium text-primary">
                  Release to add
                </span>
              </div>
            )}
          </CardContent>

          <CardFooter className="gap-2 text-[9px] text-muted-foreground">
            <span>v{data.version}</span>
            <span>·</span>
            <span>{data.slug}</span>
            {data.category && (
              <>
                <span>·</span>
                <Badge
                  variant="secondary"
                  className="h-4 max-w-[80px] truncate px-1.5 text-[9px]"
                >
                  {data.category}
                </Badge>
              </>
            )}
            <span className="ml-auto">
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
          </CardFooter>
        </Card>
      </NodeStatusIndicator>
    </div>
  )
}

export default memo(PluginNodeComponent)
