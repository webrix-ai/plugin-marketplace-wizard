"use client";

import { useCallback, useEffect, useRef, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useReactFlow,
  type OnNodesChange,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Loader2 } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { slugify } from "@/lib/utils";
import PluginNodeComponent from "./PluginNode";
import type { PluginNodeType } from "./PluginNode";
import CategoryGroupNodeComponent from "./CategoryGroupNode";
import type { CategoryGroupNodeType } from "./CategoryGroupNode";
import { PluginSearch } from "./PluginSearch";
import type { DragPayload, PluginData, RegistrySkillEntry } from "@/lib/types";

type CanvasNode = PluginNodeType | CategoryGroupNodeType;

const nodeTypes = {
  plugin: PluginNodeComponent,
  categoryGroup: CategoryGroupNodeComponent,
};

const GROUP_COLS = 3;
const PLUGIN_SPACING_X = 370;
const PLUGIN_SPACING_Y = 400;
const PLUGIN_W = 320;
const PLUGIN_H_ESTIMATE = 320;
const GROUP_PAD_TOP = 70;
const GROUP_PAD_X = 50;
const GROUP_PAD_BOTTOM = 50;
const GROUP_GAP = 80;

const UNGROUPED_OFFSET_X = 60;
const UNGROUPED_OFFSET_Y = 160;

function gridPosition(index: number, yOffset = 0) {
  const col = index % GROUP_COLS;
  const row = Math.floor(index / GROUP_COLS);
  return {
    x: col * PLUGIN_SPACING_X + UNGROUPED_OFFSET_X,
    y: yOffset + row * PLUGIN_SPACING_Y + UNGROUPED_OFFSET_Y,
  };
}

function findNodeAtPoint(e: React.DragEvent, currentNodes: readonly { id: string }[]) {
  return currentNodes.find((node) => {
    const el = document.querySelector(`[data-id="${node.id}"]`);
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    );
  });
}

function PluginSkeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="w-[320px] animate-pulse rounded-xl border bg-card p-4 shadow-sm"
      style={style}
    >
      <div className="mb-3 flex items-center gap-2 border-b pb-3">
        <div className="h-3.5 w-3.5 rounded bg-muted" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="h-3.5 w-32 rounded bg-muted" />
          <div className="h-2.5 w-48 rounded bg-muted/60" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-2 w-16 rounded bg-muted/50" />
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
          <div className="size-1.5 rounded-full bg-emerald-500/30" />
          <div className="h-2.5 w-28 rounded bg-muted/40" />
        </div>
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
          <div className="size-1.5 rounded-full bg-violet-500/30" />
          <div className="h-2.5 w-36 rounded bg-muted/40" />
        </div>
      </div>
      <div className="mt-3 flex gap-2 border-t pt-3">
        <div className="h-2 w-8 rounded bg-muted/40" />
        <div className="h-2 w-12 rounded bg-muted/40" />
      </div>
    </div>
  );
}

export function Canvas() {
  const {
    plugins,
    addPlugin,
    addMcpToPlugin,
    addSkillToPlugin,
    updateSkillInPlugin,
    fetchRegistrySkillContent,
    importSkillFileToPlugin,
  } = useWizardStore();
  const isPluginsLoading = useWizardStore((s) => s.isPluginsLoading);
  const layoutVersion = useWizardStore((s) => s._layoutVersion);
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([]);
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const prevLayoutVersionRef = useRef(layoutVersion);

  useEffect(() => {
    if (prevLayoutVersionRef.current !== layoutVersion) {
      positionsRef.current.clear();
      prevLayoutVersionRef.current = layoutVersion;
    }
    setNodes(() => {
      const byCategory = new Map<string, PluginData[]>();
      const uncategorized: PluginData[] = [];

      for (const plugin of plugins) {
        const cat = plugin.category?.trim();
        if (cat) {
          if (!byCategory.has(cat)) byCategory.set(cat, []);
          byCategory.get(cat)!.push(plugin);
        } else {
          uncategorized.push(plugin);
        }
      }

      const result: CanvasNode[] = [];
      let offsetY = 0;

      for (const [category, catPlugins] of byCategory) {
        const groupId = `group:${category}`;
        const cols = Math.min(catPlugins.length, GROUP_COLS);
        const rows = Math.ceil(catPlugins.length / GROUP_COLS);
        const w = GROUP_PAD_X + (cols - 1) * PLUGIN_SPACING_X + PLUGIN_W + GROUP_PAD_X;
        const h = GROUP_PAD_TOP + (rows - 1) * PLUGIN_SPACING_Y + PLUGIN_H_ESTIMATE + GROUP_PAD_BOTTOM;

        result.push({
          id: groupId,
          type: "categoryGroup" as const,
          position: positionsRef.current.get(groupId) || { x: 60, y: offsetY },
          data: { label: category },
          style: { width: w, height: h },
          draggable: true,
          selectable: false,
        } as CategoryGroupNodeType);

        catPlugins.forEach((plugin, idx) => {
          const col = idx % GROUP_COLS;
          const row = Math.floor(idx / GROUP_COLS);
          result.push({
            id: plugin.id,
            type: "plugin" as const,
            position: {
              x: GROUP_PAD_X + col * PLUGIN_SPACING_X,
              y: GROUP_PAD_TOP + row * PLUGIN_SPACING_Y,
            },
            parentId: groupId,
            extent: "parent" as const,
            data: plugin,
          } as PluginNodeType);
        });

        offsetY += h + GROUP_GAP;
      }

      uncategorized.forEach((plugin, idx) => {
        const existing = positionsRef.current.get(plugin.id);
        result.push({
          id: plugin.id,
          type: "plugin" as const,
          position: existing || gridPosition(idx, byCategory.size > 0 ? offsetY : 0),
          data: plugin,
        } as PluginNodeType);
      });

      return result;
    });
  }, [plugins, setNodes, layoutVersion]);

  const handleNodesChange: OnNodesChange<CanvasNode> = useCallback(
    (changes) => {
      onNodesChange(changes);
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          positionsRef.current.set(change.id, change.position);
        }
      }
    },
    [onNodesChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const files = e.dataTransfer.files;
      const hasSkillFile =
        files.length > 0 &&
        /\.(zip|skill)$/i.test(files[0].name);

      if (hasSkillFile) {
        const file = files[0];
        const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

        if (findNodeAtPoint(e, getNodes())) return;

        const baseName = file.name.replace(/\.(zip|skill)$/i, "");
        const pluginId = addPlugin(slugify(`plugin-with-${baseName}`), "");
        positionsRef.current.set(pluginId, flowPos);
        setTimeout(() => importSkillFileToPlugin(pluginId, file), 0);
        return;
      }

      let payload: DragPayload;
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        payload = JSON.parse(raw);
      } catch {
        return;
      }

      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      if (findNodeAtPoint(e, getNodes())) return;

      const itemName =
        payload.type === "mcp"
          ? (payload.item as PluginData["mcps"][0]).name
          : (payload.item as PluginData["skills"][0]).name;

      const pluginId = addPlugin(slugify(`plugin-with-${itemName}`), "");

      positionsRef.current.set(pluginId, flowPos);

      setTimeout(() => {
        if (payload.type === "mcp") {
          addMcpToPlugin(pluginId, payload.item as PluginData["mcps"][0]);
        } else {
          const skill = payload.item as PluginData["skills"][0];
          addSkillToPlugin(pluginId, skill);

          if (skill._registryEntry) {
            fetchRegistrySkillContent(skill._registryEntry as RegistrySkillEntry).then((fullSkill) => {
              updateSkillInPlugin(pluginId, skill.id, {
                content: fullSkill.content,
                description: fullSkill.description,
                sourceFilePath: fullSkill.sourceFilePath,
                files: fullSkill.files,
              });
            });
          }
        }
      }, 0);
    },
    [screenToFlowPosition, getNodes, addPlugin, addMcpToPlugin, addSkillToPlugin, fetchRegistrySkillContent, updateSkillInPlugin, importSkillFileToPlugin]
  );

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <ReactFlow
          nodes={nodes}
          onNodesChange={handleNodesChange}
          nodeTypes={nodeTypes}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          fitView={plugins.length > 0}
          fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
          proOptions={proOptions}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
          className="bg-background"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            className="!text-muted-foreground/20"
          />
          <Controls
            position="bottom-center"
            orientation="horizontal"
            className="!border !bg-card [&_button]:!border-border [&_button]:!bg-card [&_button]:!text-muted-foreground [&_button:hover]:!bg-accent"
          />
          <Panel position="top-left">
            <PluginSearch />
          </Panel>
        </ReactFlow>

        {isPluginsLoading && plugins.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-4">
                <Loader2 className="size-5 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">
                  Loading plugins…
                </p>
              </div>
              <div className="flex gap-6 opacity-60">
                {[0, 1, 2].map((i) => (
                  <PluginSkeleton
                    key={i}
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {!isPluginsLoading && plugins.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-muted">
                <Plus className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No plugins yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Use the "New Plugin" button to create one, or drop items from the sidebar
              </p>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
