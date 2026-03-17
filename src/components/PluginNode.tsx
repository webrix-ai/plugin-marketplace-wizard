"use client";

import { useState, useCallback, memo } from "react";
import type { NodeProps, Node } from "@xyflow/react";
import {
  X,
  Trash2,
  GripVertical,
  Pencil,
  Check,
} from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import McpLogo from "./logo/McpLogo";
import SkillLogo from "./logo/SkillLogo";
import type { PluginData, DragPayload } from "@/lib/types";

export type PluginNodeType = Node<PluginData, "plugin">;

function PluginNodeComponent({ data, id }: NodeProps<PluginNodeType>) {
  const {
    removePlugin,
    updatePlugin,
    addMcpToPlugin,
    addSkillToPlugin,
    removeMcpFromPlugin,
    removeSkillFromPlugin,
  } = useWizardStore();

  const [isOver, setIsOver] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [nameVal, setNameVal] = useState(data.name);
  const [descVal, setDescVal] = useState(data.description);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as HTMLElement)) return;
    setIsOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOver(false);

      try {
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        const payload: DragPayload = JSON.parse(raw);

        if (payload.type === "mcp") {
          addMcpToPlugin(id, payload.item as PluginData["mcps"][0]);
        } else {
          addSkillToPlugin(id, payload.item as PluginData["skills"][0]);
        }
      } catch {
        // invalid drag data
      }
    },
    [id, addMcpToPlugin, addSkillToPlugin]
  );

  const saveName = () => {
    if (nameVal.trim()) updatePlugin(id, { name: nameVal.trim() });
    setEditingName(false);
  };

  const saveDesc = () => {
    updatePlugin(id, { description: descVal });
    setEditingDesc(false);
  };

  const totalItems = data.mcps.length + data.skills.length;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "w-[320px] rounded-xl border bg-[#12161f] shadow-2xl shadow-black/40 transition-all",
        isOver
          ? "border-indigo-500/60 ring-2 ring-indigo-500/20"
          : "border-white/[0.08]"
      )}
    >
      {/* Header */}
      <div className="relative flex items-start gap-2 rounded-t-xl border-b border-white/[0.06] bg-gradient-to-r from-indigo-600/10 via-violet-600/10 to-transparent px-3 pt-2.5 pb-2.5">
        <div className="cursor-grab pt-0.5 text-slate-600 hover:text-slate-400 active:cursor-grabbing">
          <GripVertical className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div className="nodrag flex items-center gap-1">
              <input
                type="text"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="w-full rounded bg-black/30 px-1.5 py-0.5 text-sm font-semibold text-white outline-none ring-1 ring-indigo-500/40"
                autoFocus
              />
              <button onClick={saveName} className="text-indigo-400 hover:text-indigo-300">
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="group/name flex items-center gap-1">
              <h3 className="truncate text-sm font-semibold text-white">
                {data.name}
              </h3>
              <button
                onClick={() => {
                  setNameVal(data.name);
                  setEditingName(true);
                }}
                className="nodrag text-slate-600 opacity-0 transition hover:text-slate-400 group-hover/name:opacity-100"
              >
                <Pencil className="h-2.5 w-2.5" />
              </button>
            </div>
          )}

          {editingDesc ? (
            <div className="nodrag mt-1 flex items-center gap-1">
              <input
                type="text"
                value={descVal}
                onChange={(e) => setDescVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveDesc()}
                className="w-full rounded bg-black/30 px-1.5 py-0.5 text-[11px] text-slate-300 outline-none ring-1 ring-indigo-500/40"
                placeholder="Description..."
                autoFocus
              />
              <button onClick={saveDesc} className="text-indigo-400 hover:text-indigo-300">
                <Check className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <p
              onClick={() => {
                setDescVal(data.description);
                setEditingDesc(true);
              }}
              className="nodrag mt-0.5 cursor-text truncate text-[11px] text-slate-500 hover:text-slate-400"
            >
              {data.description || "Click to add description..."}
            </p>
          )}
        </div>
        <button
          onClick={() => removePlugin(id)}
          className="nodrag rounded-md p-1 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="space-y-1 p-2.5">
        {/* MCPs Section */}
        {data.mcps.length > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/60">
              <McpLogo color="currentColor" className="h-3 w-3" />
              MCP Servers
            </p>
            <div className="space-y-0.5">
              {data.mcps.map((mcp) => (
                <div
                  key={mcp.id}
                  className="nodrag group/item flex items-center gap-2 rounded-lg bg-white/[0.02] px-2 py-1.5 transition hover:bg-emerald-500/[0.06]"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
                  <span className="flex-1 truncate text-[11px] text-slate-300">
                    {mcp.name}
                  </span>
                  <span className="text-[9px] text-slate-600">
                    {mcp.config.type || "stdio"}
                  </span>
                  <button
                    onClick={() => removeMcpFromPlugin(id, mcp.id)}
                    className="rounded p-0.5 text-slate-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover/item:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Section */}
        {data.skills.length > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-violet-400/60">
              <SkillLogo size={12} color="currentColor" />
              Skills
            </p>
            <div className="space-y-0.5">
              {data.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="nodrag group/item flex items-center gap-2 rounded-lg bg-white/[0.02] px-2 py-1.5 transition hover:bg-violet-500/[0.06]"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-400/60" />
                  <span className="flex-1 truncate text-[11px] text-slate-300">
                    {skill.name}
                  </span>
                  <button
                    onClick={() => removeSkillFromPlugin(id, skill.id)}
                    className="rounded p-0.5 text-slate-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover/item:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty / Drop Zone */}
        {totalItems === 0 && !isOver && (
          <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-white/[0.08] py-6 text-center">
            <p className="text-[11px] text-slate-500">Drop MCPs & skills here</p>
            <p className="text-[10px] text-slate-600">
              or drag from the sidebar
            </p>
          </div>
        )}

        {isOver && (
          <div className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-indigo-500/40 bg-indigo-500/[0.06] py-3 text-center">
            <span className="text-[11px] font-medium text-indigo-400">
              Release to add
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-white/[0.04] px-3 py-1.5">
        <span className="text-[9px] text-slate-600">v{data.version}</span>
        <span className="text-[9px] text-slate-700">·</span>
        <span className="text-[9px] text-slate-600">{data.slug}</span>
        <span className="ml-auto text-[9px] text-slate-600">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

export default memo(PluginNodeComponent);
