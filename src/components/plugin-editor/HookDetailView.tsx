"use client"

import { useState } from "react"
import { useWizardStore } from "@/lib/store"
import type { PluginHook } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2 } from "lucide-react"

export function HookDetailView({
  hook,
  pluginId,
  onBack,
}: {
  hook: PluginHook
  pluginId: string
  onBack: () => void
}) {
  const { updateHookInPlugin, removeHookFromPlugin } = useWizardStore()

  const isClaude = hook.platform === "claude"
  const isCursor = hook.platform === "cursor"

  const [handlerType, setHandlerType] = useState(hook.handlerType)
  const [command, setCommand] = useState(hook.command ?? "")
  const [url, setUrl] = useState(hook.url ?? "")
  const [prompt, setPrompt] = useState(hook.prompt ?? "")
  const [model, setModel] = useState(hook.model ?? "")
  const [matcher, setMatcher] = useState(hook.matcher ?? "")
  const [timeout, setTimeout] = useState(hook.timeout?.toString() ?? "")
  const [statusMessage, setStatusMessage] = useState(hook.statusMessage ?? "")
  const [runInBackground, setRunInBackground] = useState(
    hook.runInBackground ?? false,
  )
  const [failClosed, setFailClosed] = useState(hook.failClosed ?? false)
  const [loopLimit, setLoopLimit] = useState(hook.loopLimit?.toString() ?? "")

  const claudeHandlerTypes = ["command", "http", "prompt", "agent"] as const
  const cursorHandlerTypes = ["command", "prompt"] as const

  function save() {
    const updates: Partial<PluginHook> = {
      handlerType,
      matcher: matcher.trim() || undefined,
      timeout: timeout ? Number(timeout) : undefined,
    }

    if (handlerType === "command") {
      updates.command = command.trim()
      updates.url = undefined
      updates.prompt = undefined
      if (isClaude) {
        updates.runInBackground = runInBackground || undefined
        updates.statusMessage = statusMessage.trim() || undefined
      }
      if (isCursor) {
        updates.failClosed = failClosed || undefined
        updates.loopLimit = loopLimit ? Number(loopLimit) : undefined
      }
    } else if (handlerType === "http") {
      updates.url = url.trim()
      updates.command = undefined
      updates.prompt = undefined
      updates.statusMessage = statusMessage.trim() || undefined
    } else {
      updates.prompt = prompt.trim()
      updates.model = model.trim() || undefined
      updates.command = undefined
      updates.url = undefined
      if (isClaude) updates.statusMessage = statusMessage.trim() || undefined
      if (isCursor) {
        updates.failClosed = failClosed || undefined
        updates.loopLimit = loopLimit ? Number(loopLimit) : undefined
      }
    }

    updateHookInPlugin(pluginId, hook.id, updates)
    onBack()
  }

  function handleRemove() {
    removeHookFromPlugin(pluginId, hook.id)
    onBack()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header info */}
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-orange-500/10">
          <span className="text-[10px] font-bold text-orange-400">
            {hook.platform === "claude" ? "CC" : "CU"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{hook.event}</p>
          <div className="flex items-center gap-1">
            <Badge
              variant="outline"
              className={
                isClaude
                  ? "h-3.5 border-orange-500/30 px-1 text-[9px] text-orange-400"
                  : "h-3.5 border-blue-500/30 px-1 text-[9px] text-blue-400"
              }
            >
              {hook.platform === "claude" ? "Claude Code" : "Cursor"}
            </Badge>
            {isCursor && hook.cursorCategory && (
              <Badge
                variant="outline"
                className="h-3.5 border-blue-500/20 px-1 text-[9px] text-muted-foreground"
              >
                {hook.cursorCategory}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Handler Type */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[10px] uppercase tracking-wider">
          Handler Type
        </Label>
        <Select
          value={handlerType}
          onValueChange={(v) => setHandlerType(v as PluginHook["handlerType"])}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(isClaude ? claudeHandlerTypes : cursorHandlerTypes).map((t) => (
              <SelectItem key={t} value={t} className="text-xs capitalize">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Handler-specific fields */}
      {handlerType === "command" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wider">
            Command
          </Label>
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="echo 'hook fired'"
            className="h-7 font-mono text-xs"
          />
        </div>
      )}

      {handlerType === "http" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wider">URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://localhost:3001/hook"
            className="h-7 text-xs"
          />
        </div>
      )}

      {(handlerType === "prompt" || handlerType === "agent") && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wider">Prompt</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what to evaluate..."
            className="min-h-[72px] text-xs"
          />
        </div>
      )}

      {(handlerType === "prompt" || handlerType === "agent") && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wider">
            Model{" "}
            <span className="font-normal normal-case text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="claude-sonnet-4-5"
            className="h-7 text-xs"
          />
        </div>
      )}

      {/* Common fields */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[10px] uppercase tracking-wider">
          Matcher{" "}
          <span className="font-normal normal-case text-muted-foreground">
            (optional regex)
          </span>
        </Label>
        <Input
          value={matcher}
          onChange={(e) => setMatcher(e.target.value)}
          placeholder="Write|Edit"
          className="h-7 font-mono text-xs"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wider">
            Timeout{" "}
            <span className="font-normal normal-case text-muted-foreground">
              (sec)
            </span>
          </Label>
          <Input
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(e.target.value)}
            placeholder="60"
            className="h-7 text-xs"
          />
        </div>

        {isCursor && handlerType === "command" && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase tracking-wider">
              Loop Limit
            </Label>
            <Input
              type="number"
              value={loopLimit}
              onChange={(e) => setLoopLimit(e.target.value)}
              placeholder="5"
              className="h-7 text-xs"
            />
          </div>
        )}
      </div>

      {isClaude && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wider">
            Status Message{" "}
            <span className="font-normal normal-case text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
            placeholder="Running hook..."
            className="h-7 text-xs"
          />
        </div>
      )}

      {/* Boolean options */}
      <div className="flex flex-col gap-2">
        {isClaude && handlerType === "command" && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="runInBackground"
              checked={runInBackground}
              onCheckedChange={(v) => setRunInBackground(v === true)}
            />
            <Label htmlFor="runInBackground" className="text-xs cursor-pointer">
              Run in background
            </Label>
          </div>
        )}
        {isCursor && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="failClosed"
              checked={failClosed}
              onCheckedChange={(v) => setFailClosed(v === true)}
            />
            <Label htmlFor="failClosed" className="text-xs cursor-pointer">
              Fail closed (block on error)
            </Label>
          </div>
        )}
      </div>

      {/* Source path */}
      {hook.sourceFilePath && (
        <div className="rounded-md bg-muted/40 p-2">
          <p className="text-[9px] text-muted-foreground/70 font-mono break-all">
            {hook.sourceFilePath}
          </p>
        </div>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={save}>
          Save
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={onBack}>
          Cancel
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleRemove}
      >
        <Trash2 className="size-3.5 mr-1.5" />
        Remove from plugin
      </Button>
    </div>
  )
}
