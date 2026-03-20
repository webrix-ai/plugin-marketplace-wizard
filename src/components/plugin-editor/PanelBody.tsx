"use client";

import { useMemo, useState } from "react";
import {
  X,
  Package,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { slugify } from "@/lib/utils";
import { validatePluginEntry } from "@/lib/validate-marketplace";
import type { PluginData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
import { McpDetailView } from "./McpDetailView";
import { SkillDetailView } from "./SkillDetailView";
import { TagInput } from "./TagInput";

export function PanelBody({
  plugin,
  onClose,
}: {
  plugin: PluginData;
  onClose: () => void;
}) {
  const updatePlugin = useWizardStore((s) => s.updatePlugin);
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

  const previewEntry = {
    name: slug,
    source: "./plugins/" + slug,
    description,
    version,
    author: authorName
      ? { name: authorName, email: authorEmail || undefined }
      : undefined,
    keywords: tags.length ? tags : undefined,
    category: category.trim() || undefined,
  };

  const issues = validatePluginEntry(previewEntry, 0);

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
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase tracking-wider">
              Display name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase tracking-wider">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none text-xs"
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
              />
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

          {issues.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>Validation issues</AlertTitle>
              <AlertDescription>
                <ul className="mt-1 flex flex-col gap-0.5 text-[10px]">
                  {issues.map((it, i) => (
                    <li key={i}>
                      <span className="font-mono">{it.path}:</span>{" "}
                      {it.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
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
          disabled={issues.length > 0}
          onClick={save}
        >
          Save
        </Button>
      </div>
    </>
  );
}
