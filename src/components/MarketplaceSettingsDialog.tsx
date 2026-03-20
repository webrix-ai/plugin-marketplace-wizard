"use client";

import { useEffect, useState } from "react";
import { Settings2, AlertTriangle } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { validateMarketplaceSettings } from "@/lib/validate-marketplace";
import type { MarketplaceSettings } from "@/lib/marketplace-schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
    <>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
            <Settings2 className="size-3.5 text-primary" />
          </div>
          <div>
            <DialogTitle>Marketplace settings</DialogTitle>
            <DialogDescription className="sr-only">
              Configure marketplace metadata
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="mkt-name" className="text-xs">
            Marketplace name (kebab-case)
          </Label>
          <Input
            id="mkt-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="acme-tools"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="mkt-owner" className="text-xs">Owner name</Label>
            <Input
              id="mkt-owner"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mkt-email" className="text-xs">Owner email</Label>
            <Input
              id="mkt-email"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="mkt-desc" className="text-xs">Description</Label>
          <Textarea
            id="mkt-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="mkt-version" className="text-xs">
            Marketplace version
          </Label>
          <Input
            id="mkt-version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0.0"
          />
        </div>

        {issues.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Validation issues</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 flex flex-col gap-0.5 text-xs">
                {issues.map((it, i) => (
                  <li key={i}>
                    <span className="font-mono">{it.path}:</span> {it.message}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={issues.length > 0} onClick={save}>
          Save
        </Button>
      </DialogFooter>
    </>
  );
}

export function MarketplaceSettingsDialog({ open, onClose }: Props) {
  const marketplaceSettings = useWizardStore((s) => s.marketplaceSettings);
  const refreshGitDefaults = useWizardStore((s) => s.refreshGitDefaults);

  useEffect(() => {
    if (open) refreshGitDefaults();
  }, [open, refreshGitDefaults]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <MarketplaceSettingsFormBody
          key={`${marketplaceSettings.name}|${marketplaceSettings.owner.name}`}
          initial={marketplaceSettings}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
