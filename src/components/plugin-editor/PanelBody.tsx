"use client";

import { useMemo, useState } from "react";
import {
  X,
  Package,
  Plus,
  AlertCircle,
  ChevronRight,
  Wrench,
} from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { slugify } from "@/lib/utils";
import {
  validatePluginData,
  validateMcpServer,
  validateSkill,
  validateAgent,
  getSkillDirName,
  type ValidationIssue,
} from "@/lib/validate-marketplace";
import type { PluginData, AgentData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import McpLogo from "@/components/logo/McpLogo";
import SkillLogo from "@/components/logo/SkillLogo";
import AgentLogo from "@/components/logo/AgentLogo";
import { McpDetailView } from "./McpDetailView";
import { SkillDetailView } from "./SkillDetailView";
import { AgentDetailView } from "./AgentDetailView";
import { TagInput } from "./TagInput";

export function PanelBody({
  plugin,
  onClose,
}: {
  plugin: PluginData;
  onClose: () => void;
}) {
  const updatePlugin = useWizardStore((s) => s.updatePlugin);
  const removeMcpFromPlugin = useWizardStore((s) => s.removeMcpFromPlugin);
  const removeSkillFromPlugin = useWizardStore((s) => s.removeSkillFromPlugin);
  const addAgentToPlugin = useWizardStore((s) => s.addAgentToPlugin);
  const removeAgentFromPlugin = useWizardStore((s) => s.removeAgentFromPlugin);
  const plugins = useWizardStore((s) => s.plugins);
  const categories = useWizardStore((s) => s.categories);
  const addCategory = useWizardStore((s) => s.addCategory);
  const selectedItemId = useWizardStore((s) => s.selectedItemId);
  const selectedItemType = useWizardStore((s) => s.selectedItemType);
  const setSelectedItemInPlugin = useWizardStore(
    (s) => s.setSelectedItemInPlugin
  );

  const [name, setName] = useState(plugin.name);
  const [description, setDescription] = useState(plugin.description);
  const [authorName, setAuthorName] = useState(plugin.author?.name || "");
  const [authorEmail, setAuthorEmail] = useState(plugin.author?.email || "");
  const [version, setVersion] = useState(plugin.version);
  const [tags, setTags] = useState<string[]>(plugin.keywords || []);
  const [category, setCategory] = useState(plugin.category || "");
  const [newCatInput, setNewCatInput] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);

  const slug = slugify(name);

  const keywordSuggestions = useMemo(() => {
    const all = new Set<string>();
    for (const p of plugins) {
      if (p.id === plugin.id) continue;
      for (const kw of p.keywords || []) {
        all.add(kw.toLowerCase());
      }
    }
    return [...all].sort();
  }, [plugins, plugin.id]);

  const livePlugin: PluginData = {
    ...plugin,
    name: name.trim(),
    slug,
    description: description.trim(),
    version: version.trim(),
    author: authorName.trim()
      ? { name: authorName.trim(), email: authorEmail.trim() || undefined }
      : undefined,
    keywords: tags.length ? tags : undefined,
    category: category.trim() || undefined,
    agents: plugin.agents ?? [],
  };

  const issues = useMemo(() => validatePluginData(livePlugin), [livePlugin]);
  const issueErrors = useMemo(
    () => issues.filter((i) => i.severity !== "warning"),
    [issues],
  );
  const issueWarnings = useMemo(
    () => issues.filter((i) => i.severity === "warning"),
    [issues],
  );

  const mcpNames = useMemo(() => new Set(plugin.mcps.map((m) => m.name?.trim()).filter(Boolean)), [plugin.mcps]);
  const skillLabels = useMemo(() => {
    const labels = new Set<string>();
    for (const s of plugin.skills) {
      const dir = getSkillDirName(s);
      if (dir) labels.add(dir);
      if (s.name?.trim()) labels.add(s.name.trim());
    }
    return labels;
  }, [plugin.skills]);
  const agentNames = useMemo(
    () => new Set((plugin.agents ?? []).map((a) => a.name?.trim()).filter(Boolean)),
    [plugin.agents]
  );

  function findItemByRoot(path: string) {
    const root = path.split(".")[0];
    const mcp = plugin.mcps.find((m) => m.name?.trim() === root);
    if (mcp) return { type: "mcp" as const, id: mcp.id };
    const skill = plugin.skills.find((s) => {
      const sDir = getSkillDirName(s);
      return sDir === root || s.name?.trim() === root;
    });
    if (skill) return { type: "skill" as const, id: skill.id };
    const agent = (plugin.agents ?? []).find((a) => a.name?.trim() === root);
    if (agent) return { type: "agent" as const, id: agent.id };
    return null;
  }

  function getFixAction(issue: ValidationIssue): (() => void) | null {
    if (issue.path === "version" && !version.trim()) {
      return () => setVersion("1.0.0");
    }
    const item = findItemByRoot(issue.path);
    if (item) return () => setSelectedItemInPlugin(item.id, item.type);
    return null;
  }

  function getFixLabel(issue: ValidationIssue): string {
    if (issue.path === "version") return "Set 1.0.0";
    const root = issue.path.split(".")[0];
    if (mcpNames.has(root)) return "Go to MCP";
    if (skillLabels.has(root)) return "Go to Skill";
    if (agentNames.has(root)) return "Go to Agent";
    return "Fix";
  }

  function fieldError(path: string): string | undefined {
    const issue = issues.find((i) => i.path === path && i.severity !== "warning");
    return issue?.message;
  }

  function fieldWarning(path: string): string | undefined {
    const issue = issues.find((i) => i.path === path && i.severity === "warning");
    return issue?.message;
  }

  const save = () => {
    const author = authorName.trim()
      ? { name: authorName.trim(), email: authorEmail.trim() || undefined }
      : undefined;

    updatePlugin(plugin.id, {
      name: name.trim(),
      description: description.trim(),
      version: version.trim() || "1.0.0",
      author,
      keywords: tags.length ? tags : undefined,
      category: category.trim() || undefined,
    });
    onClose();
  };

  const selectedMcp =
    selectedItemId && selectedItemType === "mcp"
      ? plugin.mcps.find((m) => m.id === selectedItemId)
      : null;
  const selectedSkill =
    selectedItemId && selectedItemType === "skill"
      ? plugin.skills.find((s) => s.id === selectedItemId)
      : null;
  const selectedAgent =
    selectedItemId && selectedItemType === "agent"
      ? (plugin.agents ?? []).find((a) => a.id === selectedItemId)
      : null;

  function createBlankAgent() {
    const id = crypto.randomUUID();
    const agent: AgentData = {
      id,
      name: "new-agent",
      description: "",
      sourceFilePath: ".claude/agents/new-agent.md",
      scope: "local",
      content: "---\nname: new-agent\ndescription: Describe when Claude should delegate to this agent\ntools: Read, Grep, Glob\n---\n\n# System Prompt\n\nDescribe how this agent should behave and what it should focus on.\n",
    };
    addAgentToPlugin(plugin.id, agent);
    setSelectedItemInPlugin(id, "agent");
  }

  if (selectedMcp) {
    return (
      <>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-emerald-500/10">
              <McpLogo color="#34d399" className="size-3" />
            </div>
            <div>
              <h2 className="text-xs font-semibold">MCP Server</h2>
              <p className="text-[9px] text-muted-foreground">{plugin.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <McpDetailView
            mcp={selectedMcp}
            pluginId={plugin.id}
            onBack={() => setSelectedItemInPlugin(null, null)}
          />
        </div>
      </>
    );
  }

  if (selectedSkill) {
    return (
      <>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-violet-500/10">
              <SkillLogo size={12} color="#a78bfa" />
            </div>
            <div>
              <h2 className="text-xs font-semibold">Skill</h2>
              <p className="text-[9px] text-muted-foreground">{plugin.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <SkillDetailView
            skill={selectedSkill}
            pluginId={plugin.id}
            onBack={() => setSelectedItemInPlugin(null, null)}
          />
        </div>
      </>
    );
  }

  if (selectedAgent) {
    return (
      <>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-blue-500/10">
              <AgentLogo size={12} color="#3b82f6" />
            </div>
            <div>
              <h2 className="text-xs font-semibold">Agent</h2>
              <p className="text-[9px] text-muted-foreground">{plugin.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <AgentDetailView
            agent={selectedAgent}
            pluginId={plugin.id}
            onBack={() => setSelectedItemInPlugin(null, null)}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-violet-500/10">
            <Package className="size-3 text-violet-500" />
          </div>
          <div>
            <h2 className="text-xs font-semibold">Edit plugin</h2>
            <p className="font-mono text-[9px] text-muted-foreground">
              {slug}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-4">
          {issues.length > 0 && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-red-500/10 px-2.5 py-1.5">
                <AlertCircle className="size-3 shrink-0 text-red-500" />
                <span className="text-[10px] font-semibold text-red-500">
                  {issueErrors.length > 0 &&
                    `${issueErrors.length} error${issueErrors.length !== 1 ? "s" : ""}`}
                  {issueErrors.length > 0 && issueWarnings.length > 0 && " · "}
                  {issueWarnings.length > 0 && (
                    <span className="text-amber-500">
                      {issueWarnings.length} warning{issueWarnings.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex flex-col divide-y divide-red-500/10">
                {issues.map((issue, i) => {
                  const fix = getFixAction(issue);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-2.5 py-1.5"
                    >
                      <span
                        className={`size-1.5 shrink-0 rounded-full ${
                          issue.severity === "warning"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px]">
                          {issue.message}
                        </p>
                        <p className="truncate font-mono text-[9px] text-muted-foreground">
                          {issue.path}
                        </p>
                      </div>
                      {fix && (
                        <button
                          type="button"
                          onClick={fix}
                          className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[9px] font-medium text-primary transition hover:bg-primary/10"
                        >
                          <Wrench className="size-2.5" />
                          {getFixLabel(issue)}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase tracking-wider">
              Display name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-7 text-xs"
              placeholder="my-plugin-name"
              aria-invalid={!!fieldError("name")}
              maxLength={128}
            />
            <div className="flex items-center justify-between">
              {fieldError("name") ? (
                <p className="text-[9px] text-destructive">{fieldError("name")}</p>
              ) : (
                <span />
              )}
              <span className="text-[9px] tabular-nums text-muted-foreground">
                {name.length}/128
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase tracking-wider">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none text-xs max-h-32"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] uppercase tracking-wider">
                Author name
              </Label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="h-7 text-xs"
                placeholder="Name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] uppercase tracking-wider">
                Author email
              </Label>
              <Input
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                className="h-7 text-xs"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] uppercase tracking-wider">
                Version
              </Label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="h-7 text-xs"
                aria-invalid={!!fieldError("version")}
              />
              {fieldWarning("version") && (
                <p className="text-[9px] text-amber-500">{fieldWarning("version")}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] uppercase tracking-wider">
                Category
              </Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v ?? "")}
              >
                <SelectTrigger className="h-7 w-full text-xs">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="">None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {showNewCat ? (
                <div className="mt-1 flex items-center gap-1">
                  <Input
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCatInput.trim()) {
                        addCategory(newCatInput.trim());
                        setCategory(newCatInput.trim());
                        setNewCatInput("");
                        setShowNewCat(false);
                      }
                    }}
                    placeholder="Category name..."
                    className="h-6 flex-1 text-[11px]"
                    autoFocus
                  />
                  <Button
                    size="xs"
                    onClick={() => {
                      if (newCatInput.trim()) {
                        addCategory(newCatInput.trim());
                        setCategory(newCatInput.trim());
                      }
                      setNewCatInput("");
                      setShowNewCat(false);
                    }}
                  >
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      setShowNewCat(false);
                      setNewCatInput("");
                    }}
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="link"
                  size="xs"
                  className="mt-1 h-auto justify-start p-0 text-[10px]"
                  onClick={() => setShowNewCat(true)}
                >
                  <Plus data-icon="inline-start" /> New category
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase tracking-wider">
              Keywords
            </Label>
            <TagInput
              tags={tags}
              onChange={setTags}
              suggestions={keywordSuggestions}
            />
          </div>

        </div>

        <div className="flex flex-col gap-2 border-t px-4 py-3">
          {/* MCP Servers */}
          <div>
            <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-500/80">
              <McpLogo color="currentColor" className="size-3" />
              MCP Servers
              <span className="ml-auto font-normal text-muted-foreground">
                {plugin.mcps.length}
              </span>
            </p>
            <div className="flex flex-col gap-0.5">
              {plugin.mcps.map((mcp) => {
                const mcpIssues = validateMcpServer(mcp);
                const hasErrors = mcpIssues.some((i) => i.severity !== "warning");
                return (
                  <div
                    key={mcp.id}
                    className="group flex items-center rounded-lg transition hover:bg-emerald-500/5"
                  >
                    <button
                      onClick={() => setSelectedItemInPlugin(mcp.id, "mcp")}
                      className="flex flex-1 items-center gap-2 px-2 py-1.5 text-left"
                    >
                      {mcpIssues.length > 0 ? (
                        <AlertCircle
                          className={`size-3 shrink-0 ${hasErrors ? "text-red-500" : "text-amber-500"}`}
                        />
                      ) : (
                        <div className="size-1.5 shrink-0 rounded-full bg-emerald-500/60" />
                      )}
                      <span className="flex-1 truncate text-[11px]">
                        {mcp.name}
                      </span>
                      <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => removeMcpFromPlugin(plugin.id, mcp.id)}
                      className="mr-1 hidden shrink-0 rounded-md p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:block"
                      title="Remove MCP"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                );
              })}
              <p className="mt-0.5 text-[9px] text-muted-foreground">
                Drag MCP servers from the sidebar to add.
              </p>
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-violet-500/80">
              <SkillLogo size={12} color="currentColor" />
              Skills
              <span className="ml-auto font-normal text-muted-foreground">
                {plugin.skills.length}
              </span>
            </p>
            <div className="flex flex-col gap-0.5">
              {plugin.skills.map((skill) => {
                const skillIssues = skill._loading ? [] : validateSkill(skill);
                const hasErrors = skillIssues.some((i) => i.severity !== "warning");
                const dir = getSkillDirName(skill);
                const namesDiffer = dir && dir !== skill.name?.trim();
                return (
                  <div
                    key={skill.id}
                    className="group flex items-center rounded-lg transition hover:bg-violet-500/5"
                  >
                    <button
                      onClick={() => setSelectedItemInPlugin(skill.id, "skill")}
                      className="flex flex-1 items-center gap-2 px-2 py-1.5 text-left"
                    >
                      {skillIssues.length > 0 ? (
                        <AlertCircle
                          className={`size-3 shrink-0 ${hasErrors ? "text-red-500" : "text-amber-500"}`}
                        />
                      ) : (
                        <div className="size-1.5 shrink-0 rounded-full bg-violet-500/60" />
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
                      <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => removeSkillFromPlugin(plugin.id, skill.id)}
                      className="mr-1 hidden shrink-0 rounded-md p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:block"
                      title="Remove skill"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                );
              })}
              <p className="mt-0.5 text-[9px] text-muted-foreground">
                Drag skills from the sidebar to add.
              </p>
            </div>
          </div>

          {/* Agents */}
          <div>
            <div className="mb-1 flex items-center gap-1">
              <p className="flex flex-1 items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-blue-500/80">
                <AgentLogo size={12} color="currentColor" />
                Agents
                <span className="ml-auto font-normal text-muted-foreground">
                  {(plugin.agents ?? []).length}
                </span>
              </p>
              <button
                type="button"
                onClick={createBlankAgent}
                className="ml-1 flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] text-blue-500/70 hover:bg-blue-500/10 hover:text-blue-500"
                title="New agent"
              >
                <Plus className="size-2.5" />
                New
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              {(plugin.agents ?? []).map((agent) => {
                const agentIssues = validateAgent(agent);
                const hasErrors = agentIssues.some((i) => i.severity !== "warning");
                return (
                  <div
                    key={agent.id}
                    className="group flex items-center rounded-lg transition hover:bg-blue-500/5"
                  >
                    <button
                      onClick={() => setSelectedItemInPlugin(agent.id, "agent")}
                      className="flex flex-1 items-center gap-2 px-2 py-1.5 text-left"
                    >
                      {agentIssues.length > 0 ? (
                        <AlertCircle
                          className={`size-3 shrink-0 ${hasErrors ? "text-red-500" : "text-amber-500"}`}
                        />
                      ) : (
                        <div className="size-1.5 shrink-0 rounded-full bg-blue-500/60" />
                      )}
                      <span className="flex-1 truncate text-[11px]">
                        {agent.name}
                      </span>
                      <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => removeAgentFromPlugin(plugin.id, agent.id)}
                      className="mr-1 hidden shrink-0 rounded-md p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:block"
                      title="Remove agent"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                );
              })}
              {(plugin.agents ?? []).length === 0 && (
                <p className="text-[9px] text-muted-foreground">
                  No agents yet. Click &quot;New&quot; to create one.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>

      <Separator />
      <div className="flex gap-2 px-4 py-3">
        <Button
          variant="outline"
          className="flex-1"
          size="sm"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          className="flex-1"
          size="sm"
          
          onClick={save}
        >
          Save
        </Button>
      </div>
    </>
  );
}
