"use client";

import { useState } from "react";
import {
  Package,
  FolderOutput,
  Download,
  RefreshCw,
  Loader2,
  HardDriveDownload,
  Settings2,
  Undo2,
  Redo2,
} from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { MarketplaceSettingsDialog } from "./MarketplaceSettingsDialog";
import { cn } from "@/lib/utils";

export function Header() {
  const {
    outputDir,
    setOutputDir,
    marketplaceSettings,
    isExporting,
    isScanning,
    plugins,
    autoSave,
    setAutoSave,
    scan,
    exportPlugins,
    undo,
    redo,
    _undoStack,
    _redoStack,
  } = useWizardStore();
  const [marketplaceDialogOpen, setMarketplaceDialogOpen] = useState(false);

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-white/[0.06] bg-[#0d1017] px-3">
      {/* Left: brand */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
          <Package className="h-3.5 w-3.5 text-white" />
        </div>
        <h1 className="text-sm font-semibold text-white">Marketplace Wizard</h1>
        <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
          {plugins.length}
        </span>
      </div>

      {/* Center: marketplace name + version + edit button */}
      <div className="mx-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMarketplaceDialogOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 transition hover:bg-white/[0.06]"
        >
          <Settings2 className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-[11px] font-medium text-slate-200">
            {marketplaceSettings.name}
          </span>
          {marketplaceSettings.metadata.version && (
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-slate-500">
              v{marketplaceSettings.metadata.version}
            </span>
          )}
        </button>
      </div>

      {/* Right: icon buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={undo}
          disabled={_undoStack.length === 0}
          className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
          title="Undo"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={_redoStack.length === 0}
          className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
          title="Redo"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </button>

        <div className="mx-1 h-4 w-px bg-white/[0.06]" />

        <button
          type="button"
          onClick={scan}
          disabled={isScanning}
          className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-300 disabled:opacity-50"
          title="Rescan MCPs & skills"
        >
          {isScanning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setAutoSave(!autoSave)}
          className={cn(
            "rounded-md p-1.5 transition",
            autoSave
              ? "text-emerald-400 hover:bg-emerald-600/20"
              : "text-slate-600 hover:bg-white/[0.06] hover:text-slate-400"
          )}
          title={autoSave ? "Auto-save on" : "Auto-save off"}
        >
          <HardDriveDownload className="h-3.5 w-3.5" />
        </button>

        <div className="mx-1 h-4 w-px bg-white/[0.06]" />

        <div className="flex items-center gap-1 rounded-md bg-white/[0.03] px-2 py-1">
          <FolderOutput className="h-3 w-3 text-slate-600" />
          <input
            type="text"
            value={outputDir}
            onChange={(e) => setOutputDir(e.target.value)}
            className="w-36 bg-transparent text-[10px] text-slate-400 outline-none placeholder:text-slate-600"
            placeholder="Output dir"
          />
        </div>

        <button
          type="button"
          onClick={exportPlugins}
          disabled={isExporting || plugins.length === 0}
          className="rounded-md p-1.5 text-indigo-400 transition hover:bg-indigo-600/20 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Export all plugins"
        >
          {isExporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
        </button>

      </div>

      <MarketplaceSettingsDialog
        open={marketplaceDialogOpen}
        onClose={() => setMarketplaceDialogOpen(false)}
      />
    </header>
  );
}
