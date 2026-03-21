"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, FolderOpen, Globe, ChevronDown, ChevronRight, Code } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { parseAgentFrontmatter, updateAgentFrontmatter } from "@/lib/utils";
import { validateAgent } from "@/lib/validate-marketplace";
import type { AgentData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import AgentLogo from "@/components/logo/AgentLogo";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton, ValidationIssueList } from "./shared";
import { CodeEditorDialog } from "@/components/CodeEditorDialog";

const AGENT_NAME_MAX = 64;
const AGENT_DESC_MAX = 1024;

const TOOL_SUGGESTIONS = [
  "Read",
  "Write",
  "Edit",
  "Bash",
  "Grep",
  "Glob",
  "WebFetch",
  "WebSearch",
  "Agent",
  "TodoWrite",
  "NotebookEdit",
];

export function AgentDetailView({
  agent,
  pluginId,
  onBack,
}: {
  agent: AgentData;
  pluginId: string;
  onBack: () => void;
}) {
  const updateAgentInPlugin = useWizardStore((s) => s.updateAgentInPlugin);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const { frontmatter, body } = useMemo(
    () => parseAgentFrontmatter(agent.content),
    [agent.content]
  );

  const [name, setName] = useState(frontmatter.name || agent.name || "");
  const [description, setDescription] = useState(
    frontmatter.description || agent.description || ""
  );
  const [tools, setTools] = useState(frontmatter.tools ?? agent.tools ?? "");
  const [disallowedTools, setDisallowedTools] = useState(
    frontmatter.disallowedTools ?? agent.disallowedTools ?? ""
  );
  const [model, setModel] = useState(frontmatter.model ?? agent.model ?? "");
  const [permissionMode, setPermissionMode] = useState(
    frontmatter.permissionMode ?? agent.permissionMode ?? ""
  );
  const [maxTurns, setMaxTurns] = useState(
    String(frontmatter.maxTurns ?? agent.maxTurns ?? "")
  );
  const [memory, setMemory] = useState(frontmatter.memory ?? agent.memory ?? "");
  const [effort, setEffort] = useState(frontmatter.effort ?? agent.effort ?? "");
  const [isolation, setIsolation] = useState(
    frontmatter.isolation ?? agent.isolation ?? ""
  );

  const issues = useMemo(
    () => validateAgent({ ...agent, name, description }),
    [agent, name, description]
  );
  const nameIssue = issues.find((i) => i.path === "agent.name");
  const descIssue = issues.find((i) => i.path === "agent.description");

  const displayName = frontmatter.name || agent.name || "";
  const displayDesc = frontmatter.description || agent.description || "";

  const isDirty =
    name !== displayName ||
    description !== displayDesc ||
    tools !== (frontmatter.tools ?? agent.tools ?? "") ||
    disallowedTools !== (frontmatter.disallowedTools ?? agent.disallowedTools ?? "") ||
    model !== (frontmatter.model ?? agent.model ?? "") ||
    permissionMode !== (frontmatter.permissionMode ?? agent.permissionMode ?? "") ||
    maxTurns !== String(frontmatter.maxTurns ?? agent.maxTurns ?? "") ||
    memory !== (frontmatter.memory ?? agent.memory ?? "") ||
    effort !== (frontmatter.effort ?? agent.effort ?? "") ||
    isolation !== (frontmatter.isolation ?? agent.isolation ?? "");

  const handleSave = () => {
    const newName = name.trim() || agent.name;
    const newDesc = description.trim();
    const maxTurnsNum = maxTurns.trim() ? parseInt(maxTurns.trim(), 10) : undefined;

    const updatedContent = agent.content.startsWith("---")
      ? updateAgentFrontmatter(agent.content, {
          name: newName || undefined,
          description: newDesc || undefined,
          tools: tools.trim() || undefined,
          disallowedTools: disallowedTools.trim() || undefined,
          model: model || undefined,
          permissionMode: permissionMode || undefined,
          maxTurns: maxTurnsNum,
          memory: memory || undefined,
          effort: effort || undefined,
          isolation: isolation || undefined,
        })
      : agent.content;

    updateAgentInPlugin(pluginId, agent.id, {
      name: newName,
      description: newDesc,
      tools: tools.trim() || undefined,
      disallowedTools: disallowedTools.trim() || undefined,
      model: model || undefined,
      permissionMode: (permissionMode as AgentData["permissionMode"]) || undefined,
      maxTurns: maxTurnsNum,
      memory: (memory as AgentData["memory"]) || undefined,
      effort: (effort as AgentData["effort"]) || undefined,
      isolation: (isolation as AgentData["isolation"]) || undefined,
      content: updatedContent,
    });
  };

  const handleEditorSave = useCallback(
    (newContent: string) => {
      const parsed = parseAgentFrontmatter(newContent);
      const fm = parsed.frontmatter;
      const newName = fm.name || agent.name;
      const newDesc = fm.description || "";
      updateAgentInPlugin(pluginId, agent.id, {
        name: newName,
        description: newDesc,
        tools: fm.tools || undefined,
        disallowedTools: fm.disallowedTools || undefined,
        model: fm.model || undefined,
        permissionMode: (fm.permissionMode as AgentData["permissionMode"]) || undefined,
        maxTurns: fm.maxTurns,
        memory: (fm.memory as AgentData["memory"]) || undefined,
        effort: (fm.effort as AgentData["effort"]) || undefined,
        isolation: (fm.isolation as AgentData["isolation"]) || undefined,
        content: newContent,
      });
      setName(newName);
      setDescription(newDesc);
      setTools(fm.tools ?? "");
      setDisallowedTools(fm.disallowedTools ?? "");
      setModel(fm.model ?? "");
      setPermissionMode(fm.permissionMode ?? "");
      setMaxTurns(fm.maxTurns != null ? String(fm.maxTurns) : "");
      setMemory(fm.memory ?? "");
      setEffort(fm.effort ?? "");
      setIsolation(fm.isolation ?? "");
    },
    [pluginId, agent.id, agent.name, updateAgentInPlugin]
  );

  const activeToolSet = new Set(tools.split(",").map((s) => s.trim()).filter(Boolean));

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-xs" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
          <AgentLogo size={16} color="#3b82f6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{displayName || "(unnamed)"}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>agent</span>
            <span>&middot;</span>
            {agent.scope === "global" ? (
              <Badge variant="secondary" className="h-4 gap-0.5 px-1 text-[9px]">
                <Globe className="size-2.5" /> Global
              </Badge>
            ) : (
              <Badge variant="secondary" className="h-4 gap-0.5 px-1 text-[9px]">
                <FolderOpen className="size-2.5" /> Local
              </Badge>
            )}
          </div>
        </div>
      </div>

      <ValidationIssueList issues={issues} title="Agent" />

      {/* Name */}
      <div className="flex flex-col gap-1">
        <Label className="text-[10px] uppercase tracking-wider">Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-7 text-xs"
          placeholder="my-agent-name"
          aria-invalid={!!nameIssue}
          maxLength={AGENT_NAME_MAX}
        />
        <div className="flex items-center justify-between">
          {nameIssue ? (
            <p className={`text-[9px] ${nameIssue.severity === "warning" ? "text-amber-500" : "text-destructive"}`}>
              {nameIssue.message}
            </p>
          ) : (
            <span />
          )}
          <span className="text-[9px] tabular-nums text-muted-foreground">
            {(name?.length ?? 0)}/{AGENT_NAME_MAX}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <Label className="text-[10px] uppercase tracking-wider">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="resize-none text-xs"
          rows={3}
          placeholder="When should Claude delegate to this agent..."
          aria-invalid={!!descIssue}
          maxLength={AGENT_DESC_MAX}
        />
        <div className="flex items-center justify-between">
          {descIssue ? (
            <p className={`text-[9px] ${descIssue.severity === "warning" ? "text-amber-500" : "text-destructive"}`}>
              {descIssue.message}
            </p>
          ) : (
            <span />
          )}
          <span className="text-[9px] tabular-nums text-muted-foreground">
            {(description?.length ?? 0)}/{AGENT_DESC_MAX}
          </span>
        </div>
      </div>

      {/* Tools allowlist */}
      <div className="flex flex-col gap-1">
        <Label className="text-[10px] uppercase tracking-wider">Tools (allowlist)</Label>
        <Input
          value={tools}
          onChange={(e) => setTools(e.target.value)}
          className="h-7 text-xs font-mono"
          placeholder="Read, Grep, Glob, Bash"
        />
        <p className="text-[9px] text-muted-foreground">
          Comma-separated. Leave empty to inherit all tools.
        </p>
        <div className="flex flex-wrap gap-1">
          {TOOL_SUGGESTIONS.map((t) => {
            const active = activeToolSet.has(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  const current = [...activeToolSet];
                  if (active) {
                    setTools(current.filter((s) => s !== t).join(", "));
                  } else {
                    setTools([...current, t].join(", "));
                  }
                }}
                className={`rounded px-1.5 py-0.5 text-[9px] font-mono transition ${
                  active
                    ? "bg-blue-500/20 text-blue-500"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {isDirty && (
        <Button size="sm" onClick={handleSave}>
          Save
        </Button>
      )}

      {/* Advanced options */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:bg-muted hover:text-foreground">
          {advancedOpen ? (
            <ChevronDown className="size-3 shrink-0" />
          ) : (
            <ChevronRight className="size-3 shrink-0" />
          )}
          Advanced Options
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 flex flex-col gap-3">
            {/* Disallowed Tools */}
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wider">Disallowed Tools (denylist)</Label>
              <Input
                value={disallowedTools}
                onChange={(e) => setDisallowedTools(e.target.value)}
                className="h-7 text-xs font-mono"
                placeholder="Write, Edit, Bash"
              />
              <p className="text-[9px] text-muted-foreground">
                Tools to deny even if in the allowlist.
              </p>
            </div>

            {/* Model + Permission Mode */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wider">Model</Label>
                <Select value={model} onValueChange={(v) => setModel((v ?? "") === "__none__" ? "" : (v ?? ""))}>
                  <SelectTrigger className="h-7 w-full text-xs">
                    <SelectValue placeholder="Inherit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="__none__">Inherit</SelectItem>
                      <SelectItem value="sonnet">Sonnet</SelectItem>
                      <SelectItem value="opus">Opus</SelectItem>
                      <SelectItem value="haiku">Haiku</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wider">Permission Mode</Label>
                <Select
                  value={permissionMode}
                  onValueChange={(v) => setPermissionMode((v ?? "") === "__none__" ? "" : (v ?? ""))}
                >
                  <SelectTrigger className="h-7 w-full text-xs">
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="__none__">Default</SelectItem>
                      <SelectItem value="acceptEdits">Accept Edits</SelectItem>
                      <SelectItem value="dontAsk">Don&apos;t Ask</SelectItem>
                      <SelectItem value="bypassPermissions">Bypass Permissions</SelectItem>
                      <SelectItem value="plan">Plan (read-only)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Max Turns + Memory */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wider">Max Turns</Label>
                <Input
                  value={maxTurns}
                  onChange={(e) => setMaxTurns(e.target.value.replace(/[^0-9]/g, ""))}
                  className="h-7 text-xs"
                  placeholder="Unlimited"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wider">Memory</Label>
                <Select value={memory} onValueChange={(v) => setMemory((v ?? "") === "__none__" ? "" : (v ?? ""))}>
                  <SelectTrigger className="h-7 w-full text-xs">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="__none__">None</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Effort + Isolation */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wider">Effort</Label>
                <Select value={effort} onValueChange={(v) => setEffort((v ?? "") === "__none__" ? "" : (v ?? ""))}>
                  <SelectTrigger className="h-7 w-full text-xs">
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="__none__">Default</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="max">Max</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wider">Isolation</Label>
                <Select
                  value={isolation}
                  onValueChange={(v) => setIsolation((v ?? "") === "__none__" ? "" : (v ?? ""))}
                >
                  <SelectTrigger className="h-7 w-full text-xs">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="__none__">None</SelectItem>
                      <SelectItem value="worktree">Worktree</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isDirty && (
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* System Prompt */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            System Prompt
          </p>
          <div className="flex items-center gap-1">
            {body.trim() && <CopyButton text={body} />}
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
        </div>
        {body.trim() ? (
          <div className="skill-markdown max-h-[40vh] overflow-y-auto rounded-lg bg-muted p-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </div>
        ) : (
          <p className="rounded-lg bg-muted px-3 py-2 text-[10px] italic text-muted-foreground">
            No system prompt. Click &quot;Edit Source&quot; to add one.
          </p>
        )}
      </div>

      {/* Source File */}
      {agent.sourceFilePath && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Source File
          </p>
          <p className="break-all rounded-lg bg-muted px-2.5 py-1.5 text-[10px] text-muted-foreground">
            {agent.sourceFilePath}
          </p>
        </div>
      )}

      <CodeEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={`Edit Agent: ${displayName || agent.name}`}
        subtitle="Edit the full agent markdown including frontmatter (name, tools, model, etc.). Changes will sync back to all fields."
        language="markdown"
        value={agent.content}
        onSave={handleEditorSave}
      />
    </div>
  );
}
