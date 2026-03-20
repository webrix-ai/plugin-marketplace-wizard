"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  Save,
  RefreshCw,
  Loader2,
  HardDriveDownload,
  Settings2,
  Undo2,
  Redo2,
  Sun,
  Moon,
  FolderOpen,
} from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { MarketplaceSettingsDialog } from "./MarketplaceSettingsDialog";
import { Button } from "@/components/ui/button";
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
    marketplaceDir,
    marketplaceSettings,
    exportTargets,
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

  const dirDisplay = marketplaceDir
    ? marketplaceDir.split("/").slice(-2).join("/")
    : "";

  return (
    <header className="flex h-12 shrink-0 items-center border-b bg-card px-3">
      <div className="flex items-center gap-2.5">
        <AppLogo className="h-7 w-7" color="currentColor" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold">Plugin Marketplace Wizard</h1>
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
          <span className="flex items-center gap-1 ml-0.5">
            {exportTargets.cursor && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Image
                      src="/cursor.svg"
                      alt="Cursor"
                      width={14}
                      height={14}
                      className="shrink-0 dark:invert"
                    />
                  }
                />
                <TooltipContent>Exporting to Cursor</TooltipContent>
              </Tooltip>
            )}
            {exportTargets.claude && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Image
                      src="/claude.svg"
                      alt="Claude"
                      width={14}
                      height={14}
                      className="shrink-0"
                    />
                  }
                />
                <TooltipContent>Exporting to Claude</TooltipContent>
              </Tooltip>
            )}
          </span>
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
          <TooltipContent>Refresh plugins</TooltipContent>
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
              <Save />
            )}
          </TooltipTrigger>
          <TooltipContent>Save all plugins</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-4" />

        {dirDisplay && (
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <div className="flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground">
                    <FolderOpen className="size-3" />
                    <span className="text-[10px] max-w-40 truncate">{dirDisplay}</span>
                  </div>
                }
              />
              <TooltipContent>{marketplaceDir}</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="mx-1 h-4" />
          </>
        )}

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
