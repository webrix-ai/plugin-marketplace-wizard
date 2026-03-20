"use client";

import { useRef, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import type { DetailItem } from "@/components/DetailPanel";
import { Input } from "@/components/ui/input";
import { RegistryMcpItem, RegistrySkillItem, CollapsibleSection } from "./SidebarItems";

export function OfficialContent({ onSelectItem }: { onSelectItem: (item: DetailItem) => void }) {
  const {
    registryMcps,
    registryMcpsTotal,
    registryMcpsLoading,
    registrySkills,
    registrySkillsLoading,
    registryQuery,
    setRegistryQuery,
    searchRegistryMcps,
    searchRegistrySkills,
  } = useWizardStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearch = useCallback(
    (value: string) => {
      setRegistryQuery(value);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        searchRegistryMcps(value);
        searchRegistrySkills(value);
      }, 350);
    },
    [setRegistryQuery, searchRegistryMcps, searchRegistrySkills]
  );

  return (
    <>
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={registryQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search MCP registry & skills.sh..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1">
          <CollapsibleSection
            title="MCP Registry"
            count={registryMcpsLoading ? -1 : registryMcps.length}
          >
            {registryMcpsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-4 animate-spin text-emerald-500" />
                <span className="ml-2 text-[11px] text-muted-foreground">Loading registry...</span>
              </div>
            ) : registryMcps.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-[11px] text-muted-foreground">
                  {registryQuery.length >= 2 ? "No MCPs match your search" : "Type at least 2 characters to search"}
                </p>
              </div>
            ) : (
              <>
                {registryMcps.map((server) => (
                  <RegistryMcpItem
                    key={server.name + server.version}
                    server={server}
                    onSelect={() => onSelectItem({ kind: "registry-mcp", data: server })}
                  />
                ))}
                {registryMcpsTotal > registryMcps.length && (
                  <p className="px-3 py-1.5 text-center text-[10px] text-muted-foreground">
                    Showing {registryMcps.length} of {registryMcpsTotal}
                  </p>
                )}
              </>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Skills.sh"
            count={registrySkillsLoading ? -1 : registrySkills.length}
          >
            {registrySkillsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-4 animate-spin text-violet-500" />
                <span className="ml-2 text-[11px] text-muted-foreground">Searching skills...</span>
              </div>
            ) : registrySkills.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-[11px] text-muted-foreground">
                  {registryQuery.length >= 2 ? "No skills match your search" : "Type at least 2 characters to search"}
                </p>
              </div>
            ) : (
              registrySkills.map((entry) => (
                <RegistrySkillItem
                  key={entry.id}
                  entry={entry}
                  onSelect={() => onSelectItem({ kind: "registry-skill", data: entry })}
                />
              ))
            )}
          </CollapsibleSection>
        </div>
      </div>
    </>
  );
}
