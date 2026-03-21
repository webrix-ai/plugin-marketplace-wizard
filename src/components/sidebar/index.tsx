"use client";

import { useState, useEffect } from "react";
import { Monitor, Globe, Link, Plus, Sun, Moon, Bot, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTheme } from "next-themes";
import { useWizardStore } from "@/lib/store";
import { DetailPanel, type DetailItem } from "@/components/DetailPanel";
import McpLogo from "@/components/logo/McpLogo";
import SkillLogo from "@/components/logo/SkillLogo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LocalContent } from "./LocalContent";
import { RegistryContent } from "./OfficialContent";
import { CustomContent } from "./CustomContent";
import { CreatePluginDialog } from "@/components/CreatePluginDialog";

function IconRail({
  tab,
  collapsed,
  onTabChange,
  onToggleCollapse,
}: {
  tab: "mcps" | "skills" | "agents";
  collapsed: boolean;
  onTabChange: (t: "mcps" | "skills" | "agents") => void;
  onToggleCollapse: () => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <TooltipProvider delay={300}>
      <div className="flex w-[47px] shrink-0 flex-col items-center border-r bg-card/50 pt-2.5 pb-2.5">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => onTabChange("skills")}
            className={`flex w-[35px] flex-col items-center gap-0.5 rounded-lg py-1 transition-all ${
              tab === "skills"
                ? "bg-violet-500/15 text-violet-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <SkillLogo size={16} color="currentColor" />
            <span className="text-[9px] font-medium leading-none">Skills</span>
          </button>

          <button
            onClick={() => onTabChange("mcps")}
            className={`flex w-[35px] flex-col items-center gap-0.5 rounded-lg py-1 transition-all ${
              tab === "mcps"
                ? "bg-emerald-500/15 text-emerald-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <McpLogo color="currentColor" className="size-4" />
            <span className="text-[9px] font-medium leading-none">MCPs</span>
          </button>

          <button
            onClick={() => onTabChange("agents")}
            className={`flex w-[35px] flex-col items-center gap-0.5 rounded-lg py-1 transition-all ${
              tab === "agents"
                ? "bg-blue-500/15 text-blue-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Bot className="size-4" />
            <span className="text-[9px] font-medium leading-none">Agents</span>
          </button>
        </div>

        <div className="mt-auto flex flex-col items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              onClick={onToggleCollapse}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={6}>
              <p className="text-xs">
                {collapsed ? "Expand sidebar" : "Collapse sidebar"}
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={6}>
              <p className="text-xs">
                {mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

function SourceTabs({
  source,
  onChange,
}: {
  source: "local" | "registry" | "custom";
  onChange: (s: "local" | "registry" | "custom") => void;
}) {
  return (
    <div className="flex rounded-lg border p-0.5">
      <Button
        variant={source === "local" ? "secondary" : "ghost"}
        size="sm"
        className="flex-1 gap-1 px-2 text-[11px]"
        onClick={() => onChange("local")}
      >
        <Monitor className="size-3" />
        Local
      </Button>
      <Button
        variant={source === "registry" ? "secondary" : "ghost"}
        size="sm"
        className="flex-1 gap-1 px-2 text-[11px]"
        onClick={() => onChange("registry")}
      >
        <Globe className="size-3" />
        Registry
      </Button>
      <Button
        variant={source === "custom" ? "secondary" : "ghost"}
        size="sm"
        className="flex-1 gap-1 px-2 text-[11px]"
        onClick={() => onChange("custom")}
      >
        <Link className="size-3" />
        Custom
      </Button>
    </div>
  );
}

export function Sidebar() {
  const {
    sidebarTab,
    setSidebarTab,
    sidebarSource,
    setSidebarSource,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useWizardStore();
  const [selectedItem, setSelectedItem] = useState<DetailItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTabChange = (tab: "mcps" | "skills" | "agents") => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
    setSidebarTab(tab);
  };

  return (
    <>
      <aside className="relative flex shrink-0 border-r bg-card">
        <IconRail
          tab={sidebarTab}
          collapsed={sidebarCollapsed}
          onTabChange={handleTabChange}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {!sidebarCollapsed && (
          <div className="flex w-64 flex-col">
            {sidebarTab !== "agents" && (
              <div className="border-b p-3">
                <SourceTabs source={sidebarSource} onChange={setSidebarSource} />
              </div>
            )}

            {(sidebarTab === "agents" || sidebarSource === "local") && (
              <LocalContent tab={sidebarTab} onSelectItem={setSelectedItem} />
            )}
            {sidebarTab !== "agents" && sidebarSource === "registry" && (
              <RegistryContent tab={sidebarTab as "mcps" | "skills"} onSelectItem={setSelectedItem} />
            )}
            {sidebarTab !== "agents" && sidebarSource === "custom" && (
              <CustomContent tab={sidebarTab as "mcps" | "skills"} onSelectItem={setSelectedItem} />
            )}

            <Separator />
            <div className="px-3 py-2.5">
              <Button
                onClick={() => setDialogOpen(true)}
                className="w-full rounded-full"
                size="sm"
              >
                <Plus className="size-4" />
                New Plugin
              </Button>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                Drag to add to plugins
              </p>
            </div>

            {selectedItem && (
              <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}
          </div>
        )}
      </aside>

      <CreatePluginDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
