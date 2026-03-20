"use client";

import { useMemo, useState } from "react";
import { X, Package, Plus } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { cn, slugify } from "@/lib/utils";
import { validatePluginEntry } from "@/lib/validate-marketplace";
import type { PluginData } from "@/lib/types";

const KEYWORD_SUGGESTIONS = [
  "mcp",
  "skills",
  "automation",
  "productivity",
  "developer-tools",
  "integration",
  "ai",
  "cli",
  "git",
  "jira",
  "slack",
  "documentation",
  "testing",
];

function parseList(input: string): string[] {
  return input
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function PanelBody({ plugin, onClose }: { plugin: PluginData; onClose: () => void }) {
  const updatePlugin = useWizardStore((s) => s.updatePlugin);
  const gitDefaults = useWizardStore((s) => s.gitDefaults);
  const categories = useWizardStore((s) => s.categories);
  const addCategory = useWizardStore((s) => s.addCategory);

  const authorDisplay = plugin.author?.name || gitDefaults?.userName || "";
  const emailDisplay = plugin.author?.email || gitDefaults?.userEmail || "";

  const [name, setName] = useState(plugin.name);
  const [description, setDescription] = useState(plugin.description);
  const [version, setVersion] = useState(plugin.version);
  const [keywordsStr, setKeywordsStr] = useState((plugin.keywords || []).join(", "));
  const [category, setCategory] = useState(plugin.category || "");
  const [strict, setStrict] = useState(plugin.strict !== false);
  const [newCatInput, setNewCatInput] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);

  const slug = slugify(name);
  const keywords = parseList(keywordsStr);

  const previewEntry = {
    name: slug,
    source: "./plugins/" + slug,
    description,
    version,
    author: authorDisplay ? { name: authorDisplay, email: emailDisplay || undefined } : undefined,
    keywords: keywords.length ? keywords : undefined,
    category: category.trim() || undefined,
  };

  const issues = validatePluginEntry(previewEntry, 0);

  const addSuggestedKeyword = (k: string) => {
    const s = new Set(parseList(keywordsStr));
    s.add(k);
    setKeywordsStr([...s].join(", "));
  };

  const save = () => {
    const author = authorDisplay
      ? { name: authorDisplay, email: emailDisplay || undefined }
      : undefined;

    updatePlugin(plugin.id, {
      name: name.trim(),
      description: description.trim(),
      version: version.trim() || "1.0.0",
      author,
      keywords: keywords.length ? keywords : undefined,
      category: category.trim() || undefined,
      strict,
      // homepage, repository, license, tags are set automatically from git/existing data
    });
    onClose();
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10">
            <Package className="h-3 w-3 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white">Edit plugin</h2>
            <p className="text-[9px] font-mono text-slate-500">{slug}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {/* Author info (read-only, auto from git) */}
        {authorDisplay && (
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
            <p className="text-[9px] font-medium uppercase tracking-wider text-slate-600">Author (from Git)</p>
            <p className="mt-0.5 text-[11px] text-slate-300">
              {authorDisplay}
              {emailDisplay && <span className="text-slate-500"> &lt;{emailDisplay}&gt;</span>}
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Display name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500/40"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Version
            </label>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500/40"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {showNewCat ? (
              <div className="mt-1.5 flex items-center gap-1">
                <input
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
                  placeholder="Category name…"
                  className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-white outline-none focus:border-indigo-500/40"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCatInput.trim()) {
                      addCategory(newCatInput.trim());
                      setCategory(newCatInput.trim());
                    }
                    setNewCatInput("");
                    setShowNewCat(false);
                  }}
                  className="rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-indigo-500"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewCat(false); setNewCatInput(""); }}
                  className="rounded-md p-1 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewCat(true)}
                className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-400 transition hover:text-indigo-300"
              >
                <Plus className="h-3 w-3" /> New category
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Keywords
          </label>
          <input
            value={keywordsStr}
            onChange={(e) => setKeywordsStr(e.target.value)}
            placeholder="mcp, skills, …"
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500/40"
          />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {KEYWORD_SUGGESTIONS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => addSuggestedKeyword(k)}
                className="rounded-full border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-slate-500 transition hover:border-indigo-500/30 hover:text-indigo-300"
              >
                + {k}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="strict-mode-panel"
            type="checkbox"
            checked={strict}
            onChange={(e) => setStrict(e.target.checked)}
            className="rounded border-white/[0.2] bg-white/[0.05]"
          />
          <label htmlFor="strict-mode-panel" className="text-[10px] text-slate-400">
            Strict mode
          </label>
        </div>

        {/* Homepage, repository, license, tags are auto-set from git & existing data.
            Kept in the data model but not shown in UI to reduce clutter:
            - homepage?: string
            - repository?: string (filled from git remote)
            - license?: string
            - tags?: string[]
        */}

        {issues.length > 0 && (
          <ul className="space-y-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-200/90">
            {issues.map((it, i) => (
              <li key={i}>
                <span className="font-mono text-amber-400/80">{it.path}:</span> {it.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2 border-t border-white/[0.06] px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg bg-white/[0.06] py-1.5 text-[11px] font-medium text-slate-300 transition hover:bg-white/[0.1]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={issues.length > 0}
          onClick={save}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-[11px] font-medium text-white transition",
            issues.length > 0 ? "bg-slate-600 opacity-50" : "bg-indigo-600 hover:bg-indigo-500"
          )}
        >
          Save
        </button>
      </div>
    </>
  );
}

export function PluginEditorPanel() {
  const selectedPluginId = useWizardStore((s) => s.selectedPluginId);
  const plugins = useWizardStore((s) => s.plugins);
  const setSelectedPluginId = useWizardStore((s) => s.setSelectedPluginId);

  const plugin = useMemo(
    () => (selectedPluginId ? plugins.find((p) => p.id === selectedPluginId) : undefined),
    [plugins, selectedPluginId]
  );

  if (!plugin) return null;

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-white/[0.06] bg-[#0d1017]">
      <PanelBody
        key={`${plugin.id}|${plugin.version}|${plugin.slug}`}
        plugin={plugin}
        onClose={() => setSelectedPluginId(null)}
      />
    </aside>
  );
}
