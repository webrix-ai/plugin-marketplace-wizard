"use client";

import { useEffect, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Canvas } from "@/components/Canvas";
import { Toast } from "@/components/Toast";
import { useWizardStore } from "@/lib/store";

export default function Home() {
  const scan = useWizardStore((s) => s.scan);
  const loadPlugins = useWizardStore((s) => s.loadPlugins);
  const setAutoSave = useWizardStore((s) => s.setAutoSave);
  const autoSave = useWizardStore((s) => s.autoSave);
  const plugins = useWizardStore((s) => s.plugins);
  const silentExport = useWizardStore((s) => s.silentExport);
  const hasInit = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;
    // Hydrate auto-save pref from localStorage after mount (avoids SSR mismatch)
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
  }, [plugins, autoSave, silentExport]);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <Canvas />
        </div>
      </div>
      <Toast />
    </ReactFlowProvider>
  );
}
