"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  FolderOutput,
  Download,
  RefreshCw,
  Loader2,
  HardDriveDownload,
  Settings2,
  Undo2,
  Redo2,
  Sun,
  Moon,
} from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { MarketplaceSettingsDialog } from "./MarketplaceSettingsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import AppLogo from "./logo/AppLogo";
import WebrixLogo from "./logo/WebrixLogo";

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
    loadPlugins,
    exportPlugins,
    undo,
    redo,
    _undoStack,
    _redoStack,
  } = useWizardStore();
  const [marketplaceDialogOpen, setMarketplaceDialogOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="flex h-12 shrink-0 items-center border-b bg-card px-3">
      <div className="flex items-center gap-2.5">
        <AppLogo className="h-7 w-7" color="currentColor" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold">Marketplace Wizard</h1>
            <Badge variant="secondary">{plugins.length}</Badge>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-[9px]">by</span>
            <WebrixLogo className="h-[10px] w-auto" />
          </div>
        </div>
      </div>

      <div className="mx-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMarketplaceDialogOpen(true)}
          className="gap-2"
        >
          <Settings2 className="text-primary" data-icon="inline-start" />
          <span className="text-[11px] font-medium">
            {marketplaceSettings.name}
          </span>
          {marketplaceSettings.metadata.version && (
            <Badge variant="secondary" className="text-[9px]">
              v{marketplaceSettings.metadata.version}
            </Badge>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={undo}
                disabled={_undoStack.length === 0}
              />
            }
          >
            <Undo2 />
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={redo}
                disabled={_redoStack.length === 0}
              />
            }
          >
            <Redo2 />
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => loadPlugins()}
                disabled={isScanning}
              />
            }
          >
            {isScanning ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw />
            )}
          </TooltipTrigger>
          <TooltipContent>Refresh from output folder</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={autoSave ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setAutoSave(!autoSave)}
                className={autoSave ? "text-emerald-500" : ""}
              />
            }
          >
            <HardDriveDownload />
          </TooltipTrigger>
          <TooltipContent>
            {autoSave ? "Auto-save on" : "Auto-save off"}
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <div className="flex items-center gap-1 rounded-md border px-2 py-1">
          <FolderOutput className="size-3 text-muted-foreground" />
          <Input
            value={outputDir}
            onChange={(e) => setOutputDir(e.target.value)}
            className="h-5 w-36 border-0 bg-transparent px-1 text-[10px] text-muted-foreground focus-visible:ring-0"
            placeholder="Output dir"
          />
        </div>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={exportPlugins}
                disabled={isExporting || plugins.length === 0}
                className="text-primary"
              />
            }
          >
            {isExporting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download />
            )}
          </TooltipTrigger>
          <TooltipContent>Export all plugins</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              />
            }
          >
            {mounted && resolvedTheme === "dark" ? <Sun /> : <Moon />}
          </TooltipTrigger>
          <TooltipContent>
            {mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          </TooltipContent>
        </Tooltip>
      </div>

      <MarketplaceSettingsDialog
        open={marketplaceDialogOpen}
        onClose={() => setMarketplaceDialogOpen(false)}
      />
    </header>
  );
}
