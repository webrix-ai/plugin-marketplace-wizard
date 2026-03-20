"use client";

import { useEffect, useState } from "react";
import { X, Settings2 } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { validateMarketplaceSettings } from "@/lib/validate-marketplace";
import type { MarketplaceSettings } from "@/lib/marketplace-schema";

interface Props {
  open: boolean;
  onClose: () => void;
}

function MarketplaceSettingsFormBody({
  initial,
  onClose,
}: {
  initial: MarketplaceSettings;
  onClose: () => void;
}) {
  const setMarketplaceSettings = useWizardStore((s) => s.setMarketplaceSettings);

  const [name, setName] = useState(initial.name);
  const [ownerName, setOwnerName] = useState(initial.owner.name);
  const [ownerEmail, setOwnerEmail] = useState(initial.owner.email || "");
  const [description, setDescription] = useState(initial.metadata.description || "");
  const [version, setVersion] = useState(initial.metadata.version || "");

  const issues = validateMarketplaceSettings({
    name,
    owner: { name: ownerName, email: ownerEmail || undefined },
    metadata: { description, version },
  });

  const save = () => {
    setMarketplaceSettings({
      name: name.trim(),
      owner: {
        name: ownerName.trim(),
        email: ownerEmail.trim() || undefined,
      },
      metadata: {
        description: description.trim() || undefined,
        version: version.trim() || undefined,
      },
    });
    onClose();
  };

  return (
    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/[0.08] bg-[#12161f] shadow-2xl">
      <div className="sticky top-0 flex items-center justify-between border-b border-white/[0.06] bg-[#12161f] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10">
            <Settings2 className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">Marketplace settings</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">
            Marketplace name (kebab-case)
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500/40"
            placeholder="acme-tools"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Owner name</label>
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Owner email</label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Marketplace version</label>
          <input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40"
            placeholder="1.0.0"
          />
        </div>

        {issues.length > 0 && (
          <ul className="space-y-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200/90">
            {issues.map((it, i) => (
              <li key={i}>
                <span className="font-mono text-amber-400/80">{it.path}:</span> {it.message}
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/[0.06] px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.1]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={issues.length > 0}
            onClick={save}
            className={cn(
              "rounded-lg px-4 py-2 text-xs font-medium text-white transition",
              issues.length > 0 ? "bg-slate-600 opacity-50" : "bg-indigo-600 hover:bg-indigo-500"
            )}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function MarketplaceSettingsDialog({ open, onClose }: Props) {
  const marketplaceSettings = useWizardStore((s) => s.marketplaceSettings);
  const refreshGitDefaults = useWizardStore((s) => s.refreshGitDefaults);

  useEffect(() => {
    if (open) refreshGitDefaults();
  }, [open, refreshGitDefaults]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <MarketplaceSettingsFormBody
        key={`${marketplaceSettings.name}|${marketplaceSettings.owner.name}|${marketplaceSettings.owner.email ?? ""}|${marketplaceSettings.metadata.version ?? ""}|${(marketplaceSettings.metadata.description ?? "").slice(0, 32)}`}
        initial={marketplaceSettings}
        onClose={onClose}
      />
    </div>
  );
}
