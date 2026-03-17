"use client";

import {
  Package,
  FolderOutput,
  Download,
  RefreshCw,
  Loader2,
  Building2,
  HardDriveDownload,
} from "lucide-react";
import { useWizardStore } from "@/lib/store";

export function Header() {
  const {
    outputDir,
    setOutputDir,
    orgName,
    setOrgName,
    isExporting,
    isScanning,
    plugins,
    autoSave,
    setAutoSave,
    scan,
    exportPlugins,
  } = useWizardStore();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0d1017] px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
            <Package className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-sm font-semibold text-white">
            Marketplace Wizard
          </h1>
        </div>
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-400">
          {plugins.length} plugin{plugins.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
          <Building2 className="h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-24 bg-transparent text-xs text-slate-300 outline-none placeholder:text-slate-600"
            placeholder="Org name"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
          <FolderOutput className="h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={outputDir}
            onChange={(e) => setOutputDir(e.target.value)}
            className="w-44 bg-transparent text-xs text-slate-300 outline-none placeholder:text-slate-600"
            placeholder="Output directory"
          />
        </div>

        <button
          onClick={() => setAutoSave(!autoSave)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            autoSave
              ? "bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-600/30"
              : "bg-white/[0.06] text-slate-400 hover:bg-white/[0.1] hover:text-slate-300"
          }`}
          title={autoSave ? "Auto-save is on — plugins are saved automatically" : "Enable auto-save"}
        >
          <HardDriveDownload className="h-3.5 w-3.5" />
          Auto-save
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              autoSave ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]" : "bg-slate-600"
            }`}
          />
        </button>

        <button
          onClick={scan}
          disabled={isScanning}
          className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.1] disabled:opacity-50"
        >
          {isScanning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Rescan
        </button>

        <button
          onClick={exportPlugins}
          disabled={isExporting || plugins.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Export All
        </button>
      </div>
    </header>
  );
}
