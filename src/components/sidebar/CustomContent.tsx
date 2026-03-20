"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  Link,
  AlertCircle,
} from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { CustomRegistry } from "@/lib/types";
import type { DetailItem } from "@/components/DetailPanel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RegistryMcpItem, CollapsibleSection } from "./SidebarItems";

function CustomRegistrySection({
  registry,
  onSelectItem,
  onRemove,
  onRefresh,
}: {
  registry: CustomRegistry;
  onSelectItem: (item: DetailItem) => void;
  onRemove: () => void;
  onRefresh: () => void;
}) {
  const filteredServers = useWizardStore((s) => {
    const q = s.customRegistryQuery.toLowerCase();
    if (!q) return registry.servers;
    return registry.servers.filter(
      (srv) =>
        srv.name?.toLowerCase().includes(q) ||
        srv.description?.toLowerCase().includes(q) ||
        srv.title?.toLowerCase().includes(q)
    );
  });

  return (
    <CollapsibleSection
      title={registry.name}
      count={registry.loading ? -1 : filteredServers.length}
    >
      <div className="mb-1 flex items-center gap-1 px-1">
        <span className="truncate text-[9px] text-muted-foreground/70">{registry.url}</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-5 w-5 shrink-0 p-0"
          onClick={onRefresh}
          disabled={registry.loading}
        >
          <RefreshCw className={cn("size-3", registry.loading && "animate-spin")} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 shrink-0 p-0 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>

      {registry.loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="size-4 animate-spin text-emerald-500" />
          <span className="ml-2 text-[11px] text-muted-foreground">Connecting...</span>
        </div>
      ) : registry.error ? (
        <div className="flex flex-col items-center gap-1.5 px-3 py-4 text-center">
          <AlertCircle className="size-4 text-destructive" />
          <p className="text-[11px] text-destructive">{registry.error}</p>
          <Button variant="outline" size="sm" className="mt-1 h-6 text-[10px]" onClick={onRefresh}>
            Retry
          </Button>
        </div>
      ) : filteredServers.length === 0 ? (
        <div className="px-3 py-4 text-center">
          <p className="text-[11px] text-muted-foreground">No servers found</p>
        </div>
      ) : (
        <>
          {filteredServers.map((server) => (
            <RegistryMcpItem
              key={server.name + server.version}
              server={server}
              onSelect={() => onSelectItem({ kind: "registry-mcp", data: server })}
            />
          ))}
          {registry.total > filteredServers.length && (
            <p className="px-3 py-1.5 text-center text-[10px] text-muted-foreground">
              Showing {filteredServers.length} of {registry.total}
            </p>
          )}
        </>
      )}
    </CollapsibleSection>
  );
}

export function CustomContent({ onSelectItem }: { onSelectItem: (item: DetailItem) => void }) {
  const {
    customRegistries,
    customRegistryQuery,
    setCustomRegistryQuery,
    addCustomRegistry,
    removeCustomRegistry,
    refreshCustomRegistry,
  } = useWizardStore();

  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newUrl.trim()) return;
    setIsAdding(true);
    await addCustomRegistry(newUrl);
    setNewUrl("");
    setIsAdding(false);
  };

  return (
    <>
      <div className="space-y-2 px-3 pb-2">
        <div className="flex gap-1.5">
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://registry.example.com"
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
          <Button
            size="sm"
            className="h-8 shrink-0 gap-1 px-2 text-[11px]"
            onClick={handleAdd}
            disabled={!newUrl.trim() || isAdding}
          >
            {isAdding ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
            Add
          </Button>
        </div>

        {customRegistries.length > 0 && (
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={customRegistryQuery}
              onChange={(e) => setCustomRegistryQuery(e.target.value)}
              placeholder="Filter servers..."
              className="h-8 pl-8 text-xs"
            />
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {customRegistries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <Link className="size-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No custom registries</p>
            <p className="text-[10px] text-muted-foreground/70">
              Add a registry URL that implements the MCP Server Registry API
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {customRegistries.map((registry) => (
              <CustomRegistrySection
                key={registry.url}
                registry={registry}
                onSelectItem={onSelectItem}
                onRemove={() => removeCustomRegistry(registry.url)}
                onRefresh={() => refreshCustomRegistry(registry.url)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
