"use client";

import { useEffect, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/sidebar";
import { Canvas } from "@/components/Canvas";
import { PluginEditorPanel } from "@/components/plugin-editor";
import { SkillImportErrorDialog } from "@/components/SkillImportDialog";
import { useWizardStore } from "@/lib/store";
import { STORAGE_KEYS } from "@/lib/constants";

export default function Home() {
  const scan = useWizardStore((s) => s.scan);
  const connectPluginStream = useWizardStore((s) => s.connectPluginStream);
  const disconnectPluginStream = useWizardStore((s) => s.disconnectPluginStream);
  const setAutoSave = useWizardStore((s) => s.setAutoSave);
  const detectExportTargets = useWizardStore((s) => s.detectExportTargets);
  const autoSave = useWizardStore((s) => s.autoSave);
  const plugins = useWizardStore((s) => s.plugins);
  const marketplaceSettings = useWizardStore((s) => s.marketplaceSettings);
  const exportTargets = useWizardStore((s) => s.exportTargets);
  const silentExport = useWizardStore((s) => s.silentExport);
  const undo = useWizardStore((s) => s.undo);
  const redo = useWizardStore((s) => s.redo);
  const hasInit = useRef(false);
  const isFirstRender = useRef(true);
  const lastExportedSnapshot = useRef("");

  const prefetchRegistry = useWizardStore((s) => s.prefetchRegistry);
  const addCustomRegistry = useWizardStore((s) => s.addCustomRegistry);
  const addCustomSkillRepo = useWizardStore((s) => s.addCustomSkillRepo);

  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.autoSave);
      if (stored !== null) setAutoSave(stored === "true");
    } catch {}

    detectExportTargets();

    connectPluginStream();
    scan();

    prefetchRegistry();

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.customRegistries);
      if (raw) {
        const urls: string[] = JSON.parse(raw);
        for (const url of urls) addCustomRegistry(url);
      }
    } catch {}

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.customSkillRepos);
      if (raw) {
        const urls: string[] = JSON.parse(raw);
        for (const url of urls) addCustomSkillRepo(url);
      }
    } catch {}

    return () => {
      disconnectPluginStream();
    };
  }, [connectPluginStream, disconnectPluginStream, scan, setAutoSave, detectExportTargets, prefetchRegistry, addCustomRegistry, addCustomSkillRepo]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!autoSave) return;

    const snapshot = JSON.stringify({ plugins, marketplaceSettings, exportTargets });
    if (snapshot === lastExportedSnapshot.current) return;

    const timer = setTimeout(() => {
      lastExportedSnapshot.current = snapshot;
      silentExport();
    }, 1500);
    return () => clearTimeout(timer);
  }, [plugins, marketplaceSettings, exportTargets, autoSave, silentExport]);

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
      <SkillImportErrorDialog />
      <Toaster position="bottom-right" richColors />
    </ReactFlowProvider>
  );
}
