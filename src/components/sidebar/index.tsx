"use client";

import { useState } from "react";
import { Monitor, Globe, Link } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { DetailPanel, type DetailItem } from "@/components/DetailPanel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LocalContent } from "./LocalContent";
import { OfficialContent } from "./OfficialContent";
import { CustomContent } from "./CustomContent";

function SourceTabs({
  source,
  onChange,
}: {
  source: "local" | "official" | "custom";
  onChange: (s: "local" | "official" | "custom") => void;
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
        variant={source === "official" ? "secondary" : "ghost"}
        size="sm"
        className="flex-1 gap-1 px-2 text-[11px]"
        onClick={() => onChange("official")}
      >
        <Globe className="size-3" />
        Official
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
  const { sidebarSource, setSidebarSource } = useWizardStore();
  const [selectedItem, setSelectedItem] = useState<DetailItem | null>(null);

  return (
    <aside className="relative flex w-72 shrink-0 flex-col border-r bg-card">
      <div className="border-b p-3">
        <SourceTabs source={sidebarSource} onChange={setSidebarSource} />
      </div>

      {sidebarSource === "local" && <LocalContent onSelectItem={setSelectedItem} />}
      {sidebarSource === "official" && <OfficialContent onSelectItem={setSelectedItem} />}
      {sidebarSource === "custom" && <CustomContent onSelectItem={setSelectedItem} />}

      <Separator />
      <div className="px-3 py-2.5">
        <p className="text-center text-[10px] text-muted-foreground">
          Click to inspect · Drag to add to plugins
        </p>
      </div>

      {selectedItem && (
        <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </aside>
  );
}
