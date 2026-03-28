"use client"

import { useState } from "react"
import { useWizardStore } from "@/lib/store"
import type {
  ClaudeHookEvent,
  CursorHookEvent,
  ClaudeHookHandler,
  ClaudeHookItem,
  CursorHookItem,
} from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

const CLAUDE_EVENTS: ClaudeHookEvent[] = [
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

const CURSOR_AGENT_EVENTS: CursorHookEvent[] = [
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

const CURSOR_TAB_EVENTS: CursorHookEvent[] = [
  "beforeTabFileRead",
  "afterTabFileEdit",
]

const ALL_CURSOR_EVENTS: CursorHookEvent[] = [
  ...CURSOR_AGENT_EVENTS,
  ...CURSOR_TAB_EVENTS,
]

export function AddHookDialog({
  open,
  onClose,
  platform: initialPlatform,
}: {
  open: boolean
  onClose: () => void
  platform?: "claude" | "cursor"
}) {
  const { addClaudeHook, addCursorHook } = useWizardStore()
  const [loading, setLoading] = useState(false)
  const [platform, setPlatform] = useState<"claude" | "cursor">(
    initialPlatform ?? "claude",
  )

  // Claude state
  const [claudeEvent, setClaudeEvent] = useState<ClaudeHookEvent>("PreToolUse")
  const [claudeHandlerType, setClaudeHandlerType] = useState<
    "command" | "http" | "prompt" | "agent"
  >("command")
  const [claudeCommand, setClaudeCommand] = useState("")
  const [claudeUrl, setClaudeUrl] = useState("")
  const [claudePrompt, setClaudePrompt] = useState("")
  const [claudeMatcher, setClaudeMatcher] = useState("")
  const [claudeTimeout, setClaudeTimeout] = useState("")
  const [claudeScope, setClaudeScope] = useState<"global" | "local">("global")
  const [claudeStatusMessage, setClaudeStatusMessage] = useState("")
  const [claudeRunInBackground, setClaudeRunInBackground] = useState(false)

  // Cursor state
  const [cursorEvent, setCursorEvent] = useState<CursorHookEvent>("preToolUse")
  const [cursorHandlerType, setCursorHandlerType] = useState<
    "command" | "prompt"
  >("command")
  const [cursorCommand, setCursorCommand] = useState("")
  const [cursorPrompt, setCursorPrompt] = useState("")
  const [cursorMatcher, setCursorMatcher] = useState("")
  const [cursorTimeout, setCursorTimeout] = useState("")
  const [cursorScope, setCursorScope] = useState<"global" | "local">("global")
  const [cursorFailClosed, setCursorFailClosed] = useState(false)

  function reset() {
    setClaudeCommand("")
    setClaudeUrl("")
    setClaudePrompt("")
    setClaudeMatcher("")
    setClaudeTimeout("")
    setClaudeStatusMessage("")
    setClaudeRunInBackground(false)
    setCursorCommand("")
    setCursorPrompt("")
    setCursorMatcher("")
    setCursorTimeout("")
    setCursorFailClosed(false)
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      if (platform === "claude") {
        let handler: ClaudeHookHandler
        if (claudeHandlerType === "command") {
          handler = {
            type: "command",
            command: claudeCommand,
            ...(claudeTimeout ? { timeout: Number(claudeTimeout) } : {}),
            ...(claudeRunInBackground ? { run_in_background: true } : {}),
            ...(claudeStatusMessage
              ? { statusMessage: claudeStatusMessage }
              : {}),
          }
        } else if (claudeHandlerType === "http") {
          handler = {
            type: "http",
            url: claudeUrl,
            ...(claudeTimeout ? { timeout: Number(claudeTimeout) } : {}),
            ...(claudeStatusMessage
              ? { statusMessage: claudeStatusMessage }
              : {}),
          }
        } else {
          handler = {
            type: claudeHandlerType as "prompt" | "agent",
            prompt: claudePrompt,
            ...(claudeTimeout ? { timeout: Number(claudeTimeout) } : {}),
            ...(claudeStatusMessage
              ? { statusMessage: claudeStatusMessage }
              : {}),
          }
        }

        const item: Omit<ClaudeHookItem, "id"> = {
          event: claudeEvent,
          handler,
          scope: claudeScope,
          sourceFilePath: "",
          ...(claudeMatcher ? { matcher: claudeMatcher } : {}),
        }
        await addClaudeHook(item)
      } else {
        const item: Omit<CursorHookItem, "id"> = {
          event: cursorEvent,
          category: CURSOR_TAB_EVENTS.includes(cursorEvent) ? "tab" : "agent",
          type: cursorHandlerType,
          scope: cursorScope,
          sourceFilePath: "",
          ...(cursorHandlerType === "command"
            ? { command: cursorCommand }
            : { prompt: cursorPrompt }),
          ...(cursorMatcher ? { matcher: cursorMatcher } : {}),
          ...(cursorTimeout ? { timeout: Number(cursorTimeout) } : {}),
          ...(cursorFailClosed ? { failClosed: true } : {}),
        }
        await addCursorHook(item)
      }
      reset()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const canSubmit =
    platform === "claude"
      ? claudeHandlerType === "command"
        ? claudeCommand.trim().length > 0
        : claudeHandlerType === "http"
          ? claudeUrl.trim().length > 0
          : claudePrompt.trim().length > 0
      : cursorHandlerType === "command"
        ? cursorCommand.trim().length > 0
        : cursorPrompt.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Hook</DialogTitle>
        </DialogHeader>

        {/* Platform selector */}
        <div className="flex rounded-lg border p-0.5 gap-0.5">
          <Button
            variant={platform === "claude" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setPlatform("claude")}
          >
            Claude Code
          </Button>
          <Button
            variant={platform === "cursor" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setPlatform("cursor")}
          >
            Cursor
          </Button>
        </div>

        {/* Claude Code fields */}
        {platform === "claude" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Event</Label>
                <Select
                  value={claudeEvent}
                  onValueChange={(v) => setClaudeEvent(v as ClaudeHookEvent)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLAUDE_EVENTS.map((e) => (
                      <SelectItem key={e} value={e} className="text-xs">
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Handler Type</Label>
                <Select
                  value={claudeHandlerType}
                  onValueChange={(v) =>
                    setClaudeHandlerType(v as typeof claudeHandlerType)
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="command" className="text-xs">
                      Command
                    </SelectItem>
                    <SelectItem value="http" className="text-xs">
                      HTTP
                    </SelectItem>
                    <SelectItem value="prompt" className="text-xs">
                      Prompt
                    </SelectItem>
                    <SelectItem value="agent" className="text-xs">
                      Agent
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {claudeHandlerType === "command" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Command</Label>
                <Input
                  value={claudeCommand}
                  onChange={(e) => setClaudeCommand(e.target.value)}
                  placeholder="echo 'hook fired'"
                  className="h-8 font-mono text-xs"
                />
              </div>
            )}
            {claudeHandlerType === "http" && (
              <div className="space-y-1.5">
                <Label className="text-xs">URL</Label>
                <Input
                  value={claudeUrl}
                  onChange={(e) => setClaudeUrl(e.target.value)}
                  placeholder="http://localhost:3001/hook"
                  className="h-8 text-xs"
                />
              </div>
            )}
            {(claudeHandlerType === "prompt" ||
              claudeHandlerType === "agent") && (
              <div className="space-y-1.5">
                <Label className="text-xs">Prompt</Label>
                <Textarea
                  value={claudePrompt}
                  onChange={(e) => setClaudePrompt(e.target.value)}
                  placeholder="Describe what to evaluate..."
                  className="min-h-[72px] text-xs"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">
                Matcher{" "}
                <span className="text-muted-foreground">(optional regex)</span>
              </Label>
              <Input
                value={claudeMatcher}
                onChange={(e) => setClaudeMatcher(e.target.value)}
                placeholder="Write|Edit"
                className="h-8 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Status Message{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                value={claudeStatusMessage}
                onChange={(e) => setClaudeStatusMessage(e.target.value)}
                placeholder="Running hook..."
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Timeout (seconds)</Label>
                <Input
                  type="number"
                  value={claudeTimeout}
                  onChange={(e) => setClaudeTimeout(e.target.value)}
                  placeholder="60"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Scope</Label>
                <Select
                  value={claudeScope}
                  onValueChange={(v) => setClaudeScope(v as "global" | "local")}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global" className="text-xs">
                      Global (~/.claude)
                    </SelectItem>
                    <SelectItem value="local" className="text-xs">
                      Local (./.claude)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {claudeHandlerType === "command" && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="background"
                  checked={claudeRunInBackground}
                  onCheckedChange={(v) => setClaudeRunInBackground(v === true)}
                />
                <Label htmlFor="background" className="text-xs cursor-pointer">
                  Run in background
                </Label>
              </div>
            )}
          </div>
        )}

        {/* Cursor fields */}
        {platform === "cursor" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Event</Label>
                <Select
                  value={cursorEvent}
                  onValueChange={(v) => setCursorEvent(v as CursorHookEvent)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Agent Hooks
                    </div>
                    {CURSOR_AGENT_EVENTS.map((e) => (
                      <SelectItem key={e} value={e} className="text-xs">
                        {e}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Tab Hooks
                    </div>
                    {CURSOR_TAB_EVENTS.map((e) => (
                      <SelectItem key={e} value={e} className="text-xs">
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Handler Type</Label>
                <Select
                  value={cursorHandlerType}
                  onValueChange={(v) =>
                    setCursorHandlerType(v as "command" | "prompt")
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="command" className="text-xs">
                      Command
                    </SelectItem>
                    <SelectItem value="prompt" className="text-xs">
                      Prompt
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {cursorHandlerType === "command" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Command</Label>
                <Input
                  value={cursorCommand}
                  onChange={(e) => setCursorCommand(e.target.value)}
                  placeholder="./hooks/pre-tool.sh"
                  className="h-8 font-mono text-xs"
                />
              </div>
            )}
            {cursorHandlerType === "prompt" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Prompt</Label>
                <Textarea
                  value={cursorPrompt}
                  onChange={(e) => setCursorPrompt(e.target.value)}
                  placeholder="Check if this operation is safe..."
                  className="min-h-[72px] text-xs"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">
                Matcher{" "}
                <span className="text-muted-foreground">(optional regex)</span>
              </Label>
              <Input
                value={cursorMatcher}
                onChange={(e) => setCursorMatcher(e.target.value)}
                placeholder="Write|Shell"
                className="h-8 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Timeout (seconds)</Label>
                <Input
                  type="number"
                  value={cursorTimeout}
                  onChange={(e) => setCursorTimeout(e.target.value)}
                  placeholder="10"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Scope</Label>
                <Select
                  value={cursorScope}
                  onValueChange={(v) => setCursorScope(v as "global" | "local")}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global" className="text-xs">
                      Global (~/.cursor)
                    </SelectItem>
                    <SelectItem value="local" className="text-xs">
                      Local (./.cursor)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="failClosed"
                checked={cursorFailClosed}
                onCheckedChange={(v) => setCursorFailClosed(v === true)}
              />
              <Label htmlFor="failClosed" className="text-xs cursor-pointer">
                Fail closed (block on error)
              </Label>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className={cn(
              "text-white",
              platform === "claude"
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-blue-500 hover:bg-blue-600",
            )}
          >
            {loading ? "Adding…" : "Add Hook"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
