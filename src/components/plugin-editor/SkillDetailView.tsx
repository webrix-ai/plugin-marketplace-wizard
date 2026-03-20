"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Globe, FolderOpen } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { parseSkillFrontmatter } from "@/lib/utils";
import type { Skill } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import SkillLogo from "@/components/logo/SkillLogo";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "./shared";

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
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    updateSkillInPlugin(pluginId, skill.id, {
      name: name.trim() || skill.name,
      description: description.trim(),
    });
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-xs" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10">
          <SkillLogo size={16} color="#a78bfa" />
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-col gap-1">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-6 text-xs font-semibold"
                autoFocus
              />
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-6 text-[10px]"
                placeholder="Description..."
              />
              <div className="flex gap-1">
                <Button size="xs" onClick={handleSave}>
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              className="text-left text-sm font-semibold hover:underline"
              onClick={() => setEditing(true)}
            >
              {displayName}
            </button>
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

      {displayDesc && (
        <p className="text-xs text-muted-foreground">{displayDesc}</p>
      )}

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
