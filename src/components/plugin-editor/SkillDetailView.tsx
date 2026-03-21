"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowLeft,
  Globe,
  FolderOpen,
  Code,
  FileText,
  FileJson,
  FileCode,
  FolderTree,
  Plus,
  Trash2,
} from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { parseSkillFrontmatter, updateSkillFrontmatter } from "@/lib/utils";
import { validateSkill, getSkillDirName } from "@/lib/validate-marketplace";
import type { Skill, SkillFile } from "@/lib/types";
import type { EditorLanguage } from "@/components/CodeEditorDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import SkillLogo from "@/components/logo/SkillLogo";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton, ValidationIssueList } from "./shared";
import { CodeEditorDialog } from "@/components/CodeEditorDialog";

const SKILL_NAME_MAX = 64;
const SKILL_DESC_MAX = 1024;

function extToLanguage(filename: string): EditorLanguage {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "json":
      return "json";
    case "md":
    case "markdown":
      return "markdown";
    case "yaml":
    case "yml":
      return "yaml";
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";
    case "ts":
    case "mts":
    case "cts":
      return "typescript";
    case "py":
      return "python";
    case "sh":
    case "bash":
      return "shell";
    case "html":
      return "html";
    case "css":
      return "css";
    case "xml":
      return "xml";
    default:
      return "plaintext";
  }
}

function fileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "json") return <FileJson className="size-3.5 text-amber-500" />;
  if (ext === "md" || ext === "markdown")
    return <FileText className="size-3.5 text-blue-500" />;
  if (["js", "ts", "mjs", "cjs", "py", "sh", "bash", "rb"].includes(ext))
    return <FileCode className="size-3.5 text-emerald-500" />;
  return <FileText className="size-3.5 text-muted-foreground" />;
}

interface FileTreeNode {
  name: string;
  fullPath: string;
  children?: FileTreeNode[];
  file?: SkillFile;
  isSkillMd?: boolean;
}

function buildFileTree(skillContent: string, files?: SkillFile[]): FileTreeNode {
  const root: FileTreeNode = { name: "", fullPath: "", children: [] };

  function ensureDir(parts: string[]): FileTreeNode {
    let current = root;
    for (const part of parts) {
      if (!current.children) current.children = [];
      let child = current.children.find((c) => c.name === part && c.children);
      if (!child) {
        child = { name: part, fullPath: "", children: [] };
        current.children.push(child);
      }
      current = child;
    }
    return current;
  }

  root.children!.push({
    name: "SKILL.md",
    fullPath: "SKILL.md",
    isSkillMd: true,
  });

  if (files) {
    for (const file of files) {
      const parts = file.relativePath.split("/");
      const fileName = parts.pop()!;
      const parent = parts.length > 0 ? ensureDir(parts) : root;
      if (!parent.children) parent.children = [];
      parent.children.push({
        name: fileName,
        fullPath: file.relativePath,
        file,
      });
    }
  }

  return root;
}

function FileTreeItem({
  node,
  depth,
  onEdit,
  onDelete,
}: {
  node: FileTreeNode;
  depth: number;
  onEdit: (node: FileTreeNode) => void;
  onDelete?: (node: FileTreeNode) => void;
}) {
  const isDir = !!node.children;
  const isRoot = isDir && !node.name;
  const [open, setOpen] = useState(true);

  if (isRoot) {
    return (
      <>
        {node.children!.map((child) => (
          <FileTreeItem
            key={child.fullPath || child.name}
            node={child}
            depth={depth}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </>
    );
  }

  if (isDir) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-[11px] hover:bg-muted"
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
        >
          <FolderOpen className="size-3.5 text-amber-400" />
          <span className="truncate font-medium">{node.name}/</span>
        </button>
        {open &&
          node.children!.map((child) => (
            <FileTreeItem
              key={child.fullPath || child.name}
              node={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
      </div>
    );
  }

  return (
    <div
      className="group flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-muted"
      style={{ paddingLeft: `${depth * 12 + 6}px` }}
    >
      {fileIcon(node.name)}
      <button
        type="button"
        onClick={() => onEdit(node)}
        className="min-w-0 flex-1 truncate text-left text-[11px] hover:underline"
      >
        {node.name}
      </button>
      {onDelete && !node.isSkillMd && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node);
          }}
          className="hidden shrink-0 rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:block"
          title="Remove file"
        >
          <Trash2 className="size-3" />
        </button>
      )}
    </div>
  );
}

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
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<{
    title: string;
    language: EditorLanguage;
    value: string;
    isSkillMd: boolean;
    relativePath?: string;
    validate?: (v: string) => string | null;
  } | null>(null);

  const [newFileName, setNewFileName] = useState("");
  const [showNewFile, setShowNewFile] = useState(false);

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
    const newName = name.trim() || skill.name;
    const newDesc = description.trim();

    const updatedContent = skill.content.startsWith("---")
      ? updateSkillFrontmatter(skill.content, {
          name: newName,
          description: newDesc,
        })
      : skill.content;

    updateSkillInPlugin(pluginId, skill.id, {
      name: newName,
      description: newDesc,
      content: updatedContent,
    });
  };

  const handleEditorSave = useCallback(
    (newContent: string) => {
      if (!editingFile) return;

      if (editingFile.isSkillMd) {
        const parsed = parseSkillFrontmatter(newContent);
        const newName = parsed.frontmatter.name || skill.name;
        const newDesc = parsed.frontmatter.description || "";
        updateSkillInPlugin(pluginId, skill.id, {
          name: newName,
          description: newDesc,
          content: newContent,
        });
        setName(newName);
        setDescription(newDesc);
      } else if (editingFile.relativePath) {
        const updatedFiles = (skill.files || []).map((f) =>
          f.relativePath === editingFile.relativePath
            ? { ...f, content: newContent }
            : f
        );
        updateSkillInPlugin(pluginId, skill.id, { files: updatedFiles });
      }
    },
    [editingFile, pluginId, skill.id, skill.name, skill.files, updateSkillInPlugin]
  );

  const handleFileEdit = useCallback(
    (node: FileTreeNode) => {
      if (node.isSkillMd) {
        setEditingFile({
          title: `Edit SKILL.md`,
          language: "markdown",
          value: skill.content,
          isSkillMd: true,
        });
      } else if (node.file) {
        const lang = extToLanguage(node.name);
        setEditingFile({
          title: `Edit ${node.fullPath}`,
          language: lang,
          value: node.file.content,
          isSkillMd: false,
          relativePath: node.file.relativePath,
          validate:
            lang === "json"
              ? (v: string) => {
                  try {
                    JSON.parse(v);
                    return null;
                  } catch (e) {
                    return `Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`;
                  }
                }
              : undefined,
        });
      }
      setEditorOpen(true);
    },
    [skill.content]
  );

  const handleFileDelete = useCallback(
    (node: FileTreeNode) => {
      if (node.isSkillMd || !node.file) return;
      const updatedFiles = (skill.files || []).filter(
        (f) => f.relativePath !== node.file!.relativePath
      );
      updateSkillInPlugin(pluginId, skill.id, {
        files: updatedFiles.length > 0 ? updatedFiles : undefined,
      });
    },
    [pluginId, skill.id, skill.files, updateSkillInPlugin]
  );

  const handleAddFile = useCallback(() => {
    const trimmed = newFileName.trim();
    if (!trimmed) return;
    if (trimmed === "SKILL.md") return;
    if (skill.files?.some((f) => f.relativePath === trimmed)) return;

    const lang = extToLanguage(trimmed);
    let defaultContent = "";
    if (lang === "json") defaultContent = "{\n  \n}\n";
    else if (lang === "yaml") defaultContent = "# \n";
    else if (lang === "markdown") defaultContent = "# \n";

    const newFile: SkillFile = { relativePath: trimmed, content: defaultContent };
    const updatedFiles = [...(skill.files || []), newFile];
    updateSkillInPlugin(pluginId, skill.id, { files: updatedFiles });

    setNewFileName("");
    setShowNewFile(false);

    setEditingFile({
      title: `Edit ${trimmed}`,
      language: lang,
      value: defaultContent,
      isSkillMd: false,
      relativePath: trimmed,
      validate:
        lang === "json"
          ? (v: string) => {
              try {
                JSON.parse(v);
                return null;
              } catch (e) {
                return `Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`;
              }
            }
          : undefined,
    });
    setEditorOpen(true);
  }, [newFileName, skill.files, pluginId, skill.id, updateSkillInPlugin]);

  const fileTree = useMemo(
    () => buildFileTree(skill.content, skill.files),
    [skill.content, skill.files]
  );

  const totalFiles = 1 + (skill.files?.length ?? 0);

  const isDirty = name !== displayName || description !== displayDesc;

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
          <p className="truncate text-sm font-semibold">
            {displayName || "(unnamed)"}
          </p>
          {namesDiffer && (
            <p className="font-mono text-[9px] text-muted-foreground">
              slug: {dirName}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>{skill.sourceApplication}</span>
            <span>&middot;</span>
            {skill.scope === "global" ? (
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
            <p
              className={`text-[9px] ${nameIssue.severity === "warning" ? "text-amber-500" : "text-destructive"}`}
            >
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
        <Label className="text-[10px] uppercase tracking-wider">
          Description
        </Label>
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
            <p
              className={`text-[9px] ${descIssue.severity === "warning" ? "text-amber-500" : "text-destructive"}`}
            >
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

      {/* File tree */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <FolderTree className="size-3" />
            Skill Files
            <span className="ml-1 font-normal">{totalFiles}</span>
          </p>
          <Button
            variant="outline"
            size="xs"
            className="h-6 gap-1 text-[10px]"
            onClick={() => setShowNewFile(true)}
          >
            <Plus className="size-3" />
            Add File
          </Button>
        </div>

        {showNewFile && (
          <div className="mb-2 flex items-center gap-1">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddFile();
                if (e.key === "Escape") {
                  setShowNewFile(false);
                  setNewFileName("");
                }
              }}
              placeholder="path/to/file.json"
              className="h-6 flex-1 font-mono text-[11px]"
              autoFocus
            />
            <Button size="xs" className="h-6" onClick={handleAddFile}>
              Add
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setShowNewFile(false);
                setNewFileName("");
              }}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        )}

        <div className="rounded-lg border bg-muted/30">
          <FileTreeItem
            node={fileTree}
            depth={0}
            onEdit={handleFileEdit}
            onDelete={handleFileDelete}
          />
        </div>
      </div>

      {/* Skill content preview */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            SKILL.md Preview
          </p>
          <CopyButton text={body} />
        </div>
        <div className="skill-markdown max-h-[30vh] overflow-y-auto rounded-lg bg-muted p-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>
      </div>

      {/* Source file */}
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Source Path
        </p>
        <p className="break-all rounded-lg bg-muted px-2.5 py-1.5 text-[10px] text-muted-foreground">
          {skill.sourceFilePath}
        </p>
      </div>

      {editingFile && (
        <CodeEditorDialog
          open={editorOpen}
          onOpenChange={(open) => {
            setEditorOpen(open);
            if (!open) setEditingFile(null);
          }}
          title={editingFile.title}
          subtitle={
            editingFile.isSkillMd
              ? "Edit the full SKILL.md markdown including frontmatter."
              : `Editing ${editingFile.relativePath}`
          }
          language={editingFile.language}
          value={editingFile.value}
          onSave={handleEditorSave}
          validate={editingFile.validate}
        />
      )}
    </div>
  );
}
