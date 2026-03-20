"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Command } from "cmdk";
import { useReactFlow, useNodes, type Node } from "@xyflow/react";
import { Search, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PluginData } from "@/lib/types";
import { useWizardStore } from "@/lib/store";

type PluginNode = Node<PluginData, "plugin">;

function isPluginNode(n: Node): n is PluginNode {
  return n.type === "plugin";
}

function getSearchableText(data: PluginData): string {
  const parts = [
    data.name,
    data.description,
    data.slug,
    data.category,
    ...data.mcps.map((m) => m.name),
    ...data.skills.map((s) => s.name),
    ...(data.keywords ?? []),
    ...(data.tags ?? []),
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function PluginSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const allNodes = useNodes();
  const pluginNodes = allNodes.filter(isPluginNode);
  const { setCenter, getInternalNode } = useReactFlow();
  const setSelectedPluginId = useWizardStore((s) => s.setSelectedPluginId);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
    }
  }, [open]);

  const handleSelect = useCallback(
    (nodeId: string) => {
      setSelectedPluginId(nodeId);
      setOpen(false);

      const internal = getInternalNode(nodeId);
      if (internal) {
        const { width = 320, height = 300 } = internal.measured ?? {};
        const x = internal.internals.positionAbsolute.x + width / 2;
        const y = internal.internals.positionAbsolute.y + height / 2;
        setCenter(x, y, { zoom: 1.2, duration: 400 });
      }
    },
    [setCenter, getInternalNode, setSelectedPluginId],
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-md border bg-card px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          open && "ring-1 ring-primary/50",
        )}
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Search plugins…</span>
        <kbd className="pointer-events-none hidden select-none rounded border bg-muted px-1 font-mono text-[10px] sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg border bg-card shadow-lg">
            <Command
              shouldFilter={false}
              className="flex flex-col"
            >
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <Command.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search plugins…"
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              <Command.List className="max-h-64 overflow-y-auto p-1">
                <Command.Empty className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No plugins found
                </Command.Empty>
                {pluginNodes
                  .filter((n) =>
                    !query.trim() || getSearchableText(n.data).includes(query.toLowerCase()),
                  )
                  .map((node) => (
                    <Command.Item
                      key={node.id}
                      value={node.id}
                      onSelect={() => handleSelect(node.id)}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors data-[selected=true]:bg-accent"
                    >
                      <Package className="size-3.5 shrink-0 text-primary/70" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{node.data.name}</p>
                        {node.data.description && (
                          <p className="truncate text-[10px] text-muted-foreground">
                            {node.data.description}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {node.data.mcps.length + node.data.skills.length} items
                      </span>
                    </Command.Item>
                  ))}
              </Command.List>
            </Command>
          </div>
        </>
      )}
    </div>
  );
}
