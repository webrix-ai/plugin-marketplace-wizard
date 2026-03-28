"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Globe,
  FolderOpen,
  Terminal,
  Link,
  MessageSquare,
  Bot,
  ChevronDown,
  ChevronRight,
  Webhook,
  Monitor,
  Zap,
} from "lucide-react"
import { useWizardStore } from "@/lib/store"
import type {
  ClaudeHookItem,
  CursorHookItem,
  PluginHook,
  DragPayload,
} from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Event catalogs
// ---------------------------------------------------------------------------

const CLAUDE_EVENTS = [
  "SessionStart",
  "InstructionsLoaded",
  "UserPromptSubmit",
  "PreToolUse",
  "PermissionRequest",
  "PostToolUse",
  "PostToolUseFailure",
  "Notification",
  "SubagentStart",
  "SubagentStop",
  "Stop",
  "StopFailure",
  "TeammateIdle",
  "TaskCompleted",
  "ConfigChange",
  "WorktreeCreate",
  "WorktreeRemove",
  "PreCompact",
  "PostCompact",
  "Elicitation",
  "ElicitationResult",
  "SessionEnd",
]

const CURSOR_AGENT_EVENTS = [
  "sessionStart",
  "sessionEnd",
  "preToolUse",
  "postToolUse",
  "postToolUseFailure",
  "subagentStart",
  "subagentStop",
  "beforeShellExecution",
  "afterShellExecution",
  "beforeMCPExecution",
  "afterMCPExecution",
  "beforeReadFile",
  "afterFileEdit",
  "beforeSubmitPrompt",
  "preCompact",
  "stop",
  "afterAgentResponse",
  "afterAgentThought",
]

const CURSOR_TAB_EVENTS = ["beforeTabFileRead", "afterTabFileEdit"]

// ---------------------------------------------------------------------------
// Drag helpers
// ---------------------------------------------------------------------------

function makeDragPayload(hook: PluginHook): string {
  const payload: DragPayload = { type: "hook", item: hook }
  return JSON.stringify(payload)
}

function makeEventHook(
  platform: "claude" | "cursor",
  event: string,
): PluginHook {
  return {
    id: crypto.randomUUID(),
    platform,
    event,
    handlerType: "command",
    command: "",
    scope: "global",
    ...(platform === "cursor"
      ? {
          cursorCategory: CURSOR_TAB_EVENTS.includes(event)
            ? ("tab" as const)
            : ("agent" as const),
        }
      : {}),
  }
}

function makeLocalClaudeHook(item: ClaudeHookItem): PluginHook {
  const h = item.handler
  return {
    id: crypto.randomUUID(),
    platform: "claude",
    event: item.event,
    handlerType: h.type,
    command: h.type === "command" ? h.command : undefined,
    url: h.type === "http" ? h.url : undefined,
    prompt: h.type === "prompt" || h.type === "agent" ? h.prompt : undefined,
    model: h.type === "prompt" || h.type === "agent" ? h.model : undefined,
    timeout: h.timeout,
    statusMessage: h.statusMessage,
    runInBackground: h.type === "command" ? h.run_in_background : undefined,
    headers: h.type === "http" ? h.headers : undefined,
    allowedEnvVars: h.type === "http" ? h.allowedEnvVars : undefined,
    matcher: item.matcher,
    sourceFilePath: item.sourceFilePath,
    scope: item.scope,
  }
}

function makeLocalCursorHook(item: CursorHookItem): PluginHook {
  return {
    id: crypto.randomUUID(),
    platform: "cursor",
    event: item.event,
    handlerType: item.type === "prompt" ? "prompt" : "command",
    command: item.command,
    prompt: item.prompt,
    model: item.model,
    matcher: item.matcher,
    timeout: item.timeout,
    loopLimit: item.loop_limit,
    failClosed: item.failClosed,
    cursorCategory: item.category,
    sourceFilePath: item.sourceFilePath,
    scope: item.scope,
  }
}

// ---------------------------------------------------------------------------
// Handler icon
// ---------------------------------------------------------------------------

function HandlerIcon({ type }: { type: string }) {
  switch (type) {
    case "http":
      return <Link className="size-3 shrink-0" />
    case "prompt":
      return <MessageSquare className="size-3 shrink-0" />
    case "agent":
      return <Bot className="size-3 shrink-0" />
    default:
      return <Terminal className="size-3 shrink-0" />
  }
}

function ScopeIcon({ scope }: { scope?: string }) {
  if (scope === "local")
    return <FolderOpen className="size-2.5 text-muted-foreground" />
  return <Globe className="size-2.5 text-muted-foreground" />
}

// ---------------------------------------------------------------------------
// Local hook item (draggable from local config files)
// ---------------------------------------------------------------------------

function LocalHookItem({
  hook,
  color,
}: {
  hook: PluginHook
  color: "orange" | "blue"
}) {
  const summary = hook.command || hook.url || hook.prompt || ""

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("application/json", makeDragPayload(hook))
    e.dataTransfer.effectAllowed = "copy"
  }

  const colorCls =
    color === "orange"
      ? "hover:border-orange-500/20 hover:bg-orange-500/5"
      : "hover:border-blue-500/20 hover:bg-blue-500/5"
  const iconCls =
    color === "orange"
      ? "bg-orange-500/10 text-orange-400"
      : "bg-blue-500/10 text-blue-400"
  const badgeCls =
    color === "orange"
      ? "border-orange-500/30 text-orange-400"
      : "border-blue-500/30 text-blue-400"

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "group flex cursor-grab items-start gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all active:cursor-grabbing",
        colorCls,
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md",
          iconCls,
        )}
      >
        <HandlerIcon type={hook.handlerType} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-medium">{hook.event}</p>
          <Badge
            variant="outline"
            className={cn("h-3.5 shrink-0 px-1 text-[9px]", badgeCls)}
          >
            {hook.handlerType}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          {summary && (
            <span className="truncate text-[10px] text-muted-foreground font-mono">
              {summary}
            </span>
          )}
          <ScopeIcon scope={hook.scope} />
        </div>
        {hook.matcher && (
          <span className="text-[9px] text-muted-foreground/70">
            matcher: {hook.matcher}
          </span>
        )}
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

// ---------------------------------------------------------------------------
// Event template item (draggable catalog entry)
// ---------------------------------------------------------------------------

function EventItem({
  event,
  platform,
  color,
}: {
  event: string
  platform: "claude" | "cursor"
  color: "orange" | "blue"
}) {
  function handleDragStart(e: React.DragEvent) {
    const hook = makeEventHook(platform, event)
    e.dataTransfer.setData("application/json", makeDragPayload(hook))
    e.dataTransfer.effectAllowed = "copy"
  }

  const colorCls =
    color === "orange"
      ? "hover:border-orange-500/20 hover:bg-orange-500/5"
      : "hover:border-blue-500/20 hover:bg-blue-500/5"
  const dotCls = color === "orange" ? "bg-orange-400/60" : "bg-blue-400/60"

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "group flex cursor-grab items-center gap-2 rounded-lg border border-transparent px-2.5 py-1.5 transition-all active:cursor-grabbing",
        colorCls,
      )}
    >
      <div className={cn("size-1.5 shrink-0 rounded-full", dotCls)} />
      <span className="flex-1 truncate text-xs font-mono">{event}</span>
      <Badge
        variant="outline"
        className="h-4 text-[9px] opacity-0 transition group-hover:opacity-100"
      >
        Drag
      </Badge>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Collapsible section
// ---------------------------------------------------------------------------

function Section({
  title,
  count,
  color,
  children,
  defaultOpen = true,
}: {
  title: string
  count: number
  color: "orange" | "blue" | "muted"
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const badgeCls =
    color === "orange"
      ? "text-orange-400 border-orange-500/30"
      : color === "blue"
        ? "text-blue-400 border-blue-500/30"
        : "text-muted-foreground"

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left cursor-pointer">
        {open ? (
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate text-[11px] font-semibold">
          {title}
        </span>
        <Badge
          variant="outline"
          className={cn("h-4 px-1.5 text-[9px]", badgeCls)}
        >
          {count}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}

// ---------------------------------------------------------------------------
// Local tab content
// ---------------------------------------------------------------------------

function LocalTab({ query }: { query: string }) {
  const {
    claudeHooks,
    cursorHooks,
    hooksLoading,
    claudeHooksEnabled,
    cursorHooksEnabled,
    scanHooks,
  } = useWizardStore()

  useEffect(() => {
    scanHooks()
  }, [scanHooks])

  const filteredClaude = useMemo((): PluginHook[] => {
    return claudeHooks
      .filter((h) => {
        if (!query) return true
        const q = query.toLowerCase()
        const handler = h.handler
        const summary =
          handler.type === "command"
            ? handler.command
            : handler.type === "http"
              ? handler.url
              : handler.prompt
        return (
          h.event.toLowerCase().includes(q) ||
          summary?.toLowerCase().includes(q)
        )
      })
      .map(makeLocalClaudeHook)
  }, [claudeHooks, query])

  const filteredCursor = useMemo((): PluginHook[] => {
    return cursorHooks
      .filter((h) => {
        if (!query) return true
        const q = query.toLowerCase()
        return (
          h.event.toLowerCase().includes(q) ||
          h.command?.toLowerCase().includes(q) ||
          h.prompt?.toLowerCase().includes(q)
        )
      })
      .map(makeLocalCursorHook)
  }, [cursorHooks, query])

  if (hooksLoading) {
    return (
      <div className="flex flex-col gap-1 px-2.5 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!claudeHooksEnabled && !cursorHooksEnabled) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        <Webhook className="size-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">No hook configs found</p>
        <p className="text-[10px] text-muted-foreground/70">
          Configure hooks in ~/.claude/settings.json or ~/.cursor/hooks.json
        </p>
      </div>
    )
  }

  return (
    <>
      <Section title="Claude Code" count={filteredClaude.length} color="orange">
        {filteredClaude.length === 0 ? (
          <p className="px-5 pb-2 text-[10px] text-muted-foreground">
            No Claude Code hooks found
          </p>
        ) : (
          <div className="flex flex-col gap-0.5 px-1.5 pb-2">
            {filteredClaude.map((h) => (
              <LocalHookItem key={h.id} hook={h} color="orange" />
            ))}
          </div>
        )}
      </Section>

      <Separator className="my-1" />

      <Section title="Cursor" count={filteredCursor.length} color="blue">
        {filteredCursor.length === 0 ? (
          <p className="px-5 pb-2 text-[10px] text-muted-foreground">
            No Cursor hooks found
          </p>
        ) : (
          <div className="flex flex-col gap-0.5 px-1.5 pb-2">
            {filteredCursor.map((h) => (
              <LocalHookItem key={h.id} hook={h} color="blue" />
            ))}
          </div>
        )}
      </Section>
    </>
  )
}

// ---------------------------------------------------------------------------
// Events tab content
// ---------------------------------------------------------------------------

function EventsTab({ query }: { query: string }) {
  const filteredClaude = CLAUDE_EVENTS.filter(
    (e) => !query || e.toLowerCase().includes(query.toLowerCase()),
  )
  const filteredCursorAgent = CURSOR_AGENT_EVENTS.filter(
    (e) => !query || e.toLowerCase().includes(query.toLowerCase()),
  )
  const filteredCursorTab = CURSOR_TAB_EVENTS.filter(
    (e) => !query || e.toLowerCase().includes(query.toLowerCase()),
  )

  const hasAny =
    filteredClaude.length +
      filteredCursorAgent.length +
      filteredCursorTab.length >
    0

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        <Zap className="size-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          No events match &quot;{query}&quot;
        </p>
      </div>
    )
  }

  return (
    <>
      {filteredClaude.length > 0 && (
        <Section
          title="Claude Code Events"
          count={filteredClaude.length}
          color="orange"
        >
          <div className="flex flex-col gap-0.5 px-1.5 pb-2">
            {filteredClaude.map((e) => (
              <EventItem key={e} event={e} platform="claude" color="orange" />
            ))}
          </div>
        </Section>
      )}

      {filteredCursorAgent.length > 0 && (
        <>
          {filteredClaude.length > 0 && <Separator className="my-1" />}
          <Section
            title="Cursor Agent Events"
            count={filteredCursorAgent.length}
            color="blue"
          >
            <div className="flex flex-col gap-0.5 px-1.5 pb-2">
              {filteredCursorAgent.map((e) => (
                <EventItem key={e} event={e} platform="cursor" color="blue" />
              ))}
            </div>
          </Section>
        </>
      )}

      {filteredCursorTab.length > 0 && (
        <>
          {(filteredClaude.length > 0 || filteredCursorAgent.length > 0) && (
            <Separator className="my-1" />
          )}
          <Section
            title="Cursor Tab Events"
            count={filteredCursorTab.length}
            color="blue"
            defaultOpen={false}
          >
            <div className="flex flex-col gap-0.5 px-1.5 pb-2">
              {filteredCursorTab.map((e) => (
                <EventItem key={e} event={e} platform="cursor" color="blue" />
              ))}
            </div>
          </Section>
        </>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Main HooksContent
// ---------------------------------------------------------------------------

export function HooksContent() {
  const { hooksQuery, setHooksQuery } = useWizardStore()
  const [source, setSource] = useState<"local" | "events">("events")

  return (
    <>
      {/* Sub-source tabs */}
      <div className="border-b p-3">
        <div className="flex rounded-lg border p-0.5">
          <Button
            variant={source === "events" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 gap-1 px-2 text-[11px]"
            onClick={() => setSource("events")}
          >
            <Zap className="size-3" />
            Events
          </Button>
          <Button
            variant={source === "local" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 gap-1 px-2 text-[11px]"
            onClick={() => setSource("local")}
          >
            <Monitor className="size-3" />
            Local
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={hooksQuery}
            onChange={(e) => setHooksQuery(e.target.value)}
            placeholder={
              source === "events" ? "Filter events..." : "Filter hooks..."
            }
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {source === "events" ? (
          <EventsTab query={hooksQuery} />
        ) : (
          <LocalTab query={hooksQuery} />
        )}
      </div>

      <div className="border-t px-3 py-2">
        <p className="text-center text-[10px] text-muted-foreground">
          Drag to add hooks to plugins
        </p>
      </div>
    </>
  )
}
