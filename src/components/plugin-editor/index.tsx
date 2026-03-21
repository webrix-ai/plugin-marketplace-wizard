"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useWizardStore } from "@/lib/store";
import { PanelBody } from "./PanelBody";

const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 280;
const MAX_WIDTH = 700;

export function PluginEditorPanel() {
  const selectedPluginId = useWizardStore((s) => s.selectedPluginId);
  const plugins = useWizardStore((s) => s.plugins);
  const setSelectedPluginId = useWizardStore((s) => s.setSelectedPluginId);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const plugin = useMemo(
    () =>
      selectedPluginId
        ? plugins.find((p) => p.id === selectedPluginId)
        : undefined,
    [plugins, selectedPluginId]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startX.current - e.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (!plugin) return null;

  return (
    <aside
      className="relative flex shrink-0 flex-col border-l bg-card"
      style={{ width }}
    >
      <div
        onMouseDown={handleMouseDown}
        className="absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize transition-colors hover:bg-primary/10 active:bg-primary/20"
      />
      <PanelBody
        key={`${plugin.id}|${plugin.version}|${plugin.slug}`}
        plugin={plugin}
        onClose={() => setSelectedPluginId(null)}
      />
    </aside>
  );
}
