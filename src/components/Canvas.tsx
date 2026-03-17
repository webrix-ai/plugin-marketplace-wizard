"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useReactFlow,
  type Node,
  type OnNodesChange,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import PluginNodeComponent from "./PluginNode";
import type { PluginNodeType } from "./PluginNode";
import { CreatePluginDialog } from "./CreatePluginDialog";
import type { DragPayload, PluginData } from "@/lib/types";

const nodeTypes = {
  plugin: PluginNodeComponent,
};

function gridPosition(index: number) {
  const cols = 3;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return { x: col * 380 + 60, y: row * 400 + 60 };
}

export function Canvas() {
  const { plugins, addPlugin, addMcpToPlugin, addSkillToPlugin } =
    useWizardStore();
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

      const pluginId = addPlugin(
        `Plugin with ${itemName}`,
        "",
        flowPos
      );

      positionsRef.current.set(pluginId, flowPos);

      setTimeout(() => {
        if (payload.type === "mcp") {
          addMcpToPlugin(pluginId, payload.item as PluginData["mcps"][0]);
        } else {
          addSkillToPlugin(pluginId, payload.item as PluginData["skills"][0]);
        }
      }, 0);
    },
    [screenToFlowPosition, getNodes, addPlugin, addMcpToPlugin, addSkillToPlugin]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setDialogPosition(flowPos);
      setDialogOpen(true);
    },
    [screenToFlowPosition]
  );

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <>
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={[]}
          onNodesChange={handleNodesChange}
          nodeTypes={nodeTypes}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDoubleClick={handleDoubleClick}
          fitView={plugins.length > 0}
          fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
          proOptions={proOptions}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
          className="bg-[#0a0d14]"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="rgba(255,255,255,0.04)"
          />
          <Controls
            position="bottom-right"
            className="!border-white/[0.08] !bg-[#12161f] [&_button]:!border-white/[0.06] [&_button]:!bg-[#12161f] [&_button]:!text-slate-400 [&_button:hover]:!bg-white/[0.06]"
          />
          <MiniMap
            position="bottom-left"
            className="!border-white/[0.08] !bg-[#12161f]"
            nodeColor="#6366f1"
            maskColor="rgba(0,0,0,0.6)"
          />
        </ReactFlow>

        {plugins.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]">
                <Plus className="h-6 w-6 text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                No plugins yet
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Double-click the canvas or use the button below to create one
              </p>
              <p className="mt-0.5 text-xs text-slate-700">
                Drop items from the sidebar to auto-create a plugin
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setDialogPosition(undefined);
            setDialogOpen(true);
          }}
          className="absolute bottom-6 right-20 z-10 flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 hover:shadow-indigo-600/30"
        >
          <Plus className="h-3.5 w-3.5" />
          New Plugin
        </button>
      </div>

      <CreatePluginDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        position={dialogPosition}
      />
    </>
  );
}
