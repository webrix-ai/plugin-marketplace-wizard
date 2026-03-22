"use client"

import { useCallback, useMemo, useState } from "react"
import { ArrowLeft, Globe, FolderOpen, Check, Code } from "lucide-react"
import { useWizardStore } from "@/lib/store"
import { validateMcpServer } from "@/lib/validate-marketplace"
import type { McpServer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import McpLogo from "@/components/logo/McpLogo"
import { JsonBlock, ValidationIssueList } from "./shared"
import { CodeEditorDialog } from "@/components/CodeEditorDialog"

export function McpDetailView({
  mcp,
  pluginId,
  onBack,
}: {
  mcp: McpServer
  pluginId: string
  onBack: () => void
}) {
  const updateMcpInPlugin = useWizardStore((s) => s.updateMcpInPlugin)
  const [name, setName] = useState(mcp.name)
  const [editing, setEditing] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)

  const configJson = useMemo(() => {
    const obj: Record<string, unknown> = {}
    if (mcp.config.type) obj.type = mcp.config.type
    if (mcp.config.command) obj.command = mcp.config.command
    if (mcp.config.args?.length) obj.args = mcp.config.args
    if (mcp.config.url) obj.url = mcp.config.url
    if (mcp.config.env && Object.keys(mcp.config.env).length)
      obj.env = mcp.config.env
    if (mcp.config.headers && Object.keys(mcp.config.headers).length)
      obj.headers = mcp.config.headers
    return obj
  }, [mcp.config])

  const fullMcpJson = useMemo(
    () => JSON.stringify({ mcpServers: { [mcp.name]: configJson } }, null, 2),
    [mcp.name, configJson],
  )

  const handleSave = () => {
    if (name.trim()) {
      updateMcpInPlugin(pluginId, mcp.id, { name: name.trim() })
    }
    setEditing(false)
  }

  const validateJson = useCallback((value: string): string | null => {
    try {
      const parsed = JSON.parse(value)
      if (!parsed || typeof parsed !== "object") return "Must be a JSON object"
      if (parsed.mcpServers && typeof parsed.mcpServers === "object") {
        const keys = Object.keys(parsed.mcpServers)
        if (keys.length !== 1)
          return "mcpServers must have exactly one server entry"
        const server = parsed.mcpServers[keys[0]]
        if (!server || typeof server !== "object")
          return "Server config must be an object"
      }
      return null
    } catch (e) {
      return `Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`
    }
  }, [])

  const handleEditorSave = useCallback(
    (value: string) => {
      try {
        const parsed = JSON.parse(value)
        if (parsed.mcpServers && typeof parsed.mcpServers === "object") {
          const keys = Object.keys(parsed.mcpServers)
          if (keys.length === 1) {
            const newName = keys[0]
            const server = parsed.mcpServers[newName]
            const config: McpServer["config"] = {}
            if (server.type) config.type = server.type
            if (server.command) config.command = server.command
            if (server.args) config.args = server.args
            if (server.url) config.url = server.url
            if (server.env) config.env = server.env
            if (server.headers) config.headers = server.headers
            updateMcpInPlugin(pluginId, mcp.id, { name: newName, config })
            setName(newName)
            return
          }
        }
        const config: McpServer["config"] = {}
        if (parsed.type) config.type = parsed.type
        if (parsed.command) config.command = parsed.command
        if (parsed.args) config.args = parsed.args
        if (parsed.url) config.url = parsed.url
        if (parsed.env) config.env = parsed.env
        if (parsed.headers) config.headers = parsed.headers
        updateMcpInPlugin(pluginId, mcp.id, { config })
      } catch {
        // validation should have caught this
      }
    },
    [pluginId, mcp.id, updateMcpInPlugin],
  )

  const issues = useMemo(() => validateMcpServer(mcp), [mcp])
  const nameError = issues.find((i) => i.path === "mcp.name")?.message

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-xs" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
          <McpLogo color="#34d399" className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  className="h-6 text-xs font-semibold"
                  aria-invalid={!!nameError}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleSave}
                  className="text-primary"
                >
                  <Check />
                </Button>
              </div>
              {nameError && (
                <p className="text-[9px] text-destructive">{nameError}</p>
              )}
            </div>
          ) : (
            <button
              className={`text-left text-sm font-semibold hover:underline ${nameError ? "text-red-500" : ""}`}
              onClick={() => setEditing(true)}
            >
              {mcp.name || "(unnamed)"}
            </button>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>{mcp.sourceApplication}</span>
            <span>&middot;</span>
            {mcp.scope === "global" ? (
              <Badge
                variant="secondary"
                className="h-4 gap-0.5 px-1 text-[9px]"
              >
                <Globe className="size-2.5" /> Global
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="h-4 gap-0.5 px-1 text-[9px]"
              >
                <FolderOpen className="size-2.5" /> Local
              </Badge>
            )}
          </div>
        </div>
      </div>

      <ValidationIssueList issues={issues} title="MCP Server" />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Server Config
          </p>
          <Button
            variant="outline"
            size="xs"
            className="h-6 gap-1 text-[10px]"
            onClick={() => setEditorOpen(true)}
          >
            <Code className="size-3" />
            Edit Source
          </Button>
        </div>
        <JsonBlock data={{ [mcp.name]: configJson }} />
      </div>

      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Source File
        </p>
        <p className="break-all rounded-lg bg-muted px-2.5 py-1.5 text-[10px] text-muted-foreground">
          {mcp.sourceFilePath}
        </p>
      </div>

      <CodeEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={`Edit MCP: ${mcp.name}`}
        subtitle="Edit the MCP server JSON configuration. Changes will update the server name and config."
        language="json"
        value={fullMcpJson}
        onSave={handleEditorSave}
        validate={validateJson}
      />
    </div>
  )
}
