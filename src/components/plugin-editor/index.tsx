"use client";

import { useMemo } from "react";
import { useWizardStore } from "@/lib/store";
import { PanelBody } from "./PanelBody";

export function PluginEditorPanel() {
  const selectedPluginId = useWizardStore((s) => s.selectedPluginId);
  const plugins = useWizardStore((s) => s.plugins);
  const setSelectedPluginId = useWizardStore((s) => s.setSelectedPluginId);

  const plugin = useMemo(
    () =>
      selectedPluginId
        ? plugins.find((p) => p.id === selectedPluginId)
        : undefined,
    [plugins, selectedPluginId]
  );

  if (!plugin) return null;

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l bg-card">
      <PanelBody
        key={`${plugin.id}|${plugin.version}|${plugin.slug}`}
        plugin={plugin}
        onClose={() => setSelectedPluginId(null)}
      />
    </aside>
  );
}
