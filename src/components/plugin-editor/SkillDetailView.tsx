"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Globe, FolderOpen } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { parseSkillFrontmatter } from "@/lib/utils";
import { validateSkill, getSkillDirName } from "@/lib/validate-marketplace";
import type { Skill } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import SkillLogo from "@/components/logo/SkillLogo";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton, ValidationIssueList } from "./shared";

const SKILL_NAME_MAX = 64;
const SKILL_DESC_MAX = 1024;

export function SkillDetailView({
  skill,
  pluginId,
  onBack,
}: {
  skill: Skill;
  pluginId: string;
  onBack: () => void;
}) {
  const updateSkillInPlugin = useWizardStore((s) => s.updateSkillInPlugin);
  const { frontmatter, body } = useMemo(
    () => parseSkillFrontmatter(skill.content),
    [skill.content]
  );
  const displayName = frontmatter.name || skill.name;
  const displayDesc = frontmatter.description || skill.description;

  const [name, setName] = useState(displayName);
  const [description, setDescription] = useState(displayDesc);

  const dirName = useMemo(() => getSkillDirName(skill), [skill]);
  const namesDiffer = dirName && dirName !== (displayName?.trim() ?? "");

  const issues = useMemo(() => validateSkill(skill), [skill]);
  const nameIssue = issues.find((i) => i.path === "skill.name");
  const descIssue = issues.find((i) => i.path === "skill.description");

  const handleSave = () => {
    updateSkillInPlugin(pluginId, skill.id, {
      name: name.trim() || skill.name,
      description: description.trim(),
    });
  };

  const isDirty =
    name !== displayName || description !== displayDesc;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-xs" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10">
          <SkillLogo size={16} color="#a78bfa" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{displayName || "(unnamed)"}</p>
          {namesDiffer && (
            <p className="font-mono text-[9px] text-muted-foreground">
              slug: {dirName}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>{skill.sourceApplication}</span>
            <span>&middot;</span>
            {skill.scope === "global" ? (
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

      <ValidationIssueList issues={issues} title="Skill" />

      {/* Name field */}
      <div className="flex flex-col gap-1">
        <Label className="text-[10px] uppercase tracking-wider">Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-7 text-xs"
          placeholder="my-skill-name"
          aria-invalid={!!nameIssue}
          maxLength={SKILL_NAME_MAX}
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
            {(name?.length ?? 0)}/{SKILL_NAME_MAX}
          </span>
        </div>
      </div>

      {/* Description field */}
      <div className="flex flex-col gap-1">
        <Label className="text-[10px] uppercase tracking-wider">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="resize-none text-xs"
          rows={3}
          placeholder="What this skill does and when to use it..."
          aria-invalid={!!descIssue}
          maxLength={SKILL_DESC_MAX}
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
            {(description?.length ?? 0)}/{SKILL_DESC_MAX}
          </span>
        </div>
      </div>

      {isDirty && (
        <Button size="sm" onClick={handleSave}>
          Save
        </Button>
      )}

      {/* Skill content */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Skill Content
          </p>
          <CopyButton text={body} />
        </div>
        <div className="skill-markdown max-h-[50vh] overflow-y-auto rounded-lg bg-muted p-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>
      </div>

      {/* Source file */}
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Source File
        </p>
        <p className="break-all rounded-lg bg-muted px-2.5 py-1.5 text-[10px] text-muted-foreground">
          {skill.sourceFilePath}
        </p>
      </div>
    </div>
  );
}
