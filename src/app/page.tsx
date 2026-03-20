"use client";

import { useEffect, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/sidebar";
import { Canvas } from "@/components/Canvas";
import { PluginEditorPanel } from "@/components/plugin-editor";
import { useWizardStore } from "@/lib/store";
import { STORAGE_KEYS } from "@/lib/constants";

export default function Home() {
  const scan = useWizardStore((s) => s.scan);
  const connectPluginStream = useWizardStore((s) => s.connectPluginStream);
  const disconnectPluginStream = useWizardStore((s) => s.disconnectPluginStream);
  const setAutoSave = useWizardStore((s) => s.setAutoSave);
  const autoSave = useWizardStore((s) => s.autoSave);
  const plugins = useWizardStore((s) => s.plugins);
  const marketplaceSettings = useWizardStore((s) => s.marketplaceSettings);
  const silentExport = useWizardStore((s) => s.silentExport);
  const undo = useWizardStore((s) => s.undo);
  const redo = useWizardStore((s) => s.redo);
  const hasInit = useRef(false);
  const isFirstRender = useRef(true);
  const lastExportedSnapshot = useRef("");

  const prefetchOfficialRegistry = useWizardStore((s) => s.prefetchOfficialRegistry);
  const addCustomRegistry = useWizardStore((s) => s.addCustomRegistry);

  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.autoSave);
      if (stored !== null) setAutoSave(stored === "true");
    } catch {}

    connectPluginStream();
    scan();

    prefetchOfficialRegistry();

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.customRegistries);
      if (raw) {
        const urls: string[] = JSON.parse(raw);
        for (const url of urls) addCustomRegistry(url);
      }
    } catch {}

    return () => {
      disconnectPluginStream();
    };
  }, [connectPluginStream, disconnectPluginStream, scan, setAutoSave, prefetchOfficialRegistry, addCustomRegistry]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!autoSave) return;

    const snapshot = JSON.stringify({ plugins, marketplaceSettings });
    if (snapshot === lastExportedSnapshot.current) return;

    const timer = setTimeout(() => {
      lastExportedSnapshot.current = snapshot;
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
      <div className="flex h-screen flex-col bg-background">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <Canvas />
          <PluginEditorPanel />
        </div>
      </div>
      <Toaster position="bottom-right" richColors />
    </ReactFlowProvider>
  );
}
