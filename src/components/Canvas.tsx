"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useReactFlow,
  type OnNodesChange,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Loader2 } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import PluginNodeComponent from "./PluginNode";
import type { PluginNodeType } from "./PluginNode";
import { CreatePluginDialog } from "./CreatePluginDialog";
import { Button } from "@/components/ui/button";
import type { DragPayload, PluginData } from "@/lib/types";

const nodeTypes = {
  plugin: PluginNodeComponent,
};

function gridPosition(index: number) {
  const cols = 3;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return { x: col * 380 + 60, y: row * 400 + 160 };
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
  const { plugins, addPlugin, addMcpToPlugin, addSkillToPlugin, updateSkillInPlugin, fetchRegistrySkillContent } =
    useWizardStore();
  const isPluginsLoading = useWizardStore((s) => s.isPluginsLoading);
  const [nodes, setNodes, onNodesChange] = useNodesState<PluginNodeType>([]);
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPosition, setDialogPosition] = useState<{ x: number; y: number }>();

  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  useEffect(() => {
    setNodes((prevNodes) => {
      for (const n of prevNodes) {
        positionsRef.current.set(n.id, n.position);
      }

      return plugins.map((plugin, index) => {
        const existing = positionsRef.current.get(plugin.id);
        return {
          id: plugin.id,
          type: "plugin" as const,
          position: existing || gridPosition(index),
          data: plugin,
        };
      });
    });
  }, [plugins, setNodes]);

  const handleNodesChange: OnNodesChange<PluginNodeType> = useCallback(
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

      let payload: DragPayload;
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        payload = JSON.parse(raw);
      } catch {
        return;
      }

      const flowPos = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const currentNodes = getNodes();
      const hitNode = currentNodes.find((node) => {
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

      if (hitNode) return;

      const itemName =
        payload.type === "mcp"
          ? (payload.item as PluginData["mcps"][0]).name
          : (payload.item as PluginData["skills"][0]).name;

      const pluginId = addPlugin(`Plugin with ${itemName}`, "");

      positionsRef.current.set(pluginId, flowPos);

      setTimeout(() => {
        if (payload.type === "mcp") {
          addMcpToPlugin(pluginId, payload.item as PluginData["mcps"][0]);
        } else {
          const skill = payload.item as PluginData["skills"][0];
          addSkillToPlugin(pluginId, skill);

          if (skill._registryEntry) {
            fetchRegistrySkillContent(skill._registryEntry).then((fullSkill) => {
              updateSkillInPlugin(pluginId, skill.id, {
                content: fullSkill.content,
                description: fullSkill.description,
                sourceFilePath: fullSkill.sourceFilePath,
              });
            });
          }
        }
      }, 0);
    },
    [screenToFlowPosition, getNodes, addPlugin, addMcpToPlugin, addSkillToPlugin, fetchRegistrySkillContent, updateSkillInPlugin]
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
            position="bottom-right"
            className="!border !bg-card [&_button]:!border-border [&_button]:!bg-card [&_button]:!text-muted-foreground [&_button:hover]:!bg-accent"
          />
          <MiniMap
            position="bottom-left"
            className="!border !bg-card"
            nodeColor={() => "oklch(0.488 0.243 264.376)"}
            maskColor="oklch(0 0 0 / 40%)"
          />
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
                Use the button below to create one, or drop items from the sidebar
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={() => {
            setDialogPosition(undefined);
            setDialogOpen(true);
          }}
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full shadow-lg"
          size="sm"
        >
          <Plus data-icon="inline-start" />
          New Plugin
        </Button>
      </div>

      <CreatePluginDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        position={dialogPosition}
      />
    </>
  );
}
