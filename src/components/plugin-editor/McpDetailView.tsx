"use client";

import { useState } from "react";
import { ArrowLeft, Globe, FolderOpen, Check } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import type { McpServer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import McpLogo from "@/components/logo/McpLogo";
import { JsonBlock } from "./shared";

export function McpDetailView({
  mcp,
  pluginId,
  onBack,
}: {
  mcp: McpServer;
  pluginId: string;
  onBack: () => void;
}) {
  const updateMcpInPlugin = useWizardStore((s) => s.updateMcpInPlugin);
  const [name, setName] = useState(mcp.name);
  const [editing, setEditing] = useState(false);

  const configJson: Record<string, unknown> = {};
  if (mcp.config.type) configJson.type = mcp.config.type;
  if (mcp.config.command) configJson.command = mcp.config.command;
  if (mcp.config.args?.length) configJson.args = mcp.config.args;
  if (mcp.config.url) configJson.url = mcp.config.url;
  if (mcp.config.env && Object.keys(mcp.config.env).length)
    configJson.env = mcp.config.env;
  if (mcp.config.headers && Object.keys(mcp.config.headers).length)
    configJson.headers = mcp.config.headers;

  const handleSave = () => {
    if (name.trim()) {
      updateMcpInPlugin(pluginId, mcp.id, { name: name.trim() });
    }
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-xs" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
          <McpLogo color="#34d399" className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="h-6 text-xs font-semibold"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleSave}
                className="text-primary"
              >
                <Check />
              </Button>
            </div>
          ) : (
            <button
              className="text-left text-sm font-semibold hover:underline"
              onClick={() => setEditing(true)}
            >
              {mcp.name}
            </button>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>{mcp.sourceApplication}</span>
            <span>&middot;</span>
            {mcp.scope === "global" ? (
              <Badge variant="secondary" className="h-4 gap-0.5 px-1 text-[9px]">
                <Globe className="size-2.5" /> Global
              </Badge>
            ) : (
              <Badge variant="secondary" className="h-4 gap-0.5 px-1 text-[9px]">
                <FolderOpen className="size-2.5" /> Local
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Server Config
        </p>
        <JsonBlock data={{ [mcp.name]: configJson }} />
      </div>

      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Source File
        </p>
        <p className="break-all rounded-lg bg-muted px-2.5 py-1.5 text-[10px] text-muted-foreground">
          {mcp.sourceFilePath}
        </p>
      </div>
    </div>
  );
}
