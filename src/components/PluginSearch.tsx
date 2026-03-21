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
        if (open) {
          setOpen(false);
        } else {
          inputRef.current?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!open) setQuery("");
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

  const filtered = pluginNodes.filter(
    (n) => !query.trim() || getSearchableText(n.data).includes(query.toLowerCase()),
  );

  const highlightMatch = (text: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="bg-primary/20 text-primary">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <Command
      shouldFilter={false}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
          inputRef.current?.blur();
        }
      }}
    >
      <div
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-md border bg-card px-2 text-xs text-muted-foreground transition-colors hover:bg-accent",
          open && "ring-1 ring-primary/50",
        )}
      >
        <Search className="size-3.5 shrink-0" />
        <Command.Input
          ref={inputRef}
          value={query}
          onValueChange={(v) => {
            setQuery(v);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search plugins…"
          className="hidden w-32 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/60 sm:inline-block"
        />
        <kbd className="pointer-events-none hidden select-none rounded border bg-muted px-1 font-mono text-[10px] sm:inline-block">
          ⌘K
        </kbd>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg border bg-card shadow-lg">
            <Command.List className="max-h-64 overflow-y-auto p-1">
              <Command.Empty className="px-3 py-6 text-center text-xs text-muted-foreground">
                No plugins found
              </Command.Empty>
              {filtered.map((node) => (
                <Command.Item
                  key={node.id}
                  value={node.id}
                  onSelect={() => handleSelect(node.id)}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors data-[selected=true]:bg-accent"
                >
                  <Package className="size-3.5 shrink-0 text-primary/70" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {highlightMatch(node.data.name)}
                    </p>
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
          </div>
        </>
      )}
    </Command>
  );
}
