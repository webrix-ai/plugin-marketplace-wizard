"use client";

import { useEffect, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Canvas } from "@/components/Canvas";
import { PluginEditorPanel } from "@/components/PluginEditorPanel";
import { Toast } from "@/components/Toast";
import { useWizardStore } from "@/lib/store";

export default function Home() {
  const scan = useWizardStore((s) => s.scan);
  const loadPlugins = useWizardStore((s) => s.loadPlugins);
  const setAutoSave = useWizardStore((s) => s.setAutoSave);
  const autoSave = useWizardStore((s) => s.autoSave);
  const plugins = useWizardStore((s) => s.plugins);
  const marketplaceSettings = useWizardStore((s) => s.marketplaceSettings);
  const silentExport = useWizardStore((s) => s.silentExport);
  const undo = useWizardStore((s) => s.undo);
  const redo = useWizardStore((s) => s.redo);
  const hasInit = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;
    try {
      const stored = localStorage.getItem("marketplace-wizard:autoSave");
      if (stored !== null) setAutoSave(stored === "true");
    } catch {}
    loadPlugins().then(() => scan());
  }, [loadPlugins, scan, setAutoSave]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!autoSave) return;

    const timer = setTimeout(() => {
      silentExport();
    }, 1500);
    return () => clearTimeout(timer);
  }, [plugins, marketplaceSettings, autoSave, silentExport]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <Canvas />
          <PluginEditorPanel />
        </div>
      </div>
      <Toast />
    </ReactFlowProvider>
  );
}
