"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Settings2, AlertTriangle, Trash2 } from "lucide-react"
import { toast as sonnerToast } from "sonner"
import { useWizardStore } from "@/lib/store"
import { validateMarketplaceSettings } from "@/lib/validate-marketplace"
import type { MarketplaceSettings } from "@/lib/marketplace-schema"
import type { ExportTargets } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

interface Props {
  open: boolean
  onClose: () => void
}

const TARGET_LABELS: Record<string, string> = {
  cursor: "Cursor",
  claude: "Claude",
  github: "GitHub Copilot",
}

interface SavePayload {
  settings: {
    name: string
    owner: { name: string; email?: string }
    metadata: { description?: string; version?: string }
  }
  targets: ExportTargets
  removedTargets: string[]
}

function MarketplaceSettingsFormBody({
  initial,
  onSave,
  onClose,
}: {
  initial: MarketplaceSettings
  onSave: (payload: SavePayload) => void
  onClose: () => void
}) {
  const storeTargets = useWizardStore((s) => s.exportTargets)

  const [name, setName] = useState(initial.name)
  const [ownerName, setOwnerName] = useState(initial.owner.name)
  const [ownerEmail, setOwnerEmail] = useState(initial.owner.email || "")
  const [description, setDescription] = useState(
    initial.metadata.description || "",
  )
  const [version, setVersion] = useState(initial.metadata.version || "")

  const [localTargets, setLocalTargets] = useState<ExportTargets>({
    cursor: storeTargets.cursor,
    claude: storeTargets.claude,
    github: storeTargets.github,
  })

  const issues = validateMarketplaceSettings({
    name,
    owner: { name: ownerName, email: ownerEmail || undefined },
    metadata: { description, version },
  })

  const noneSelected = !localTargets.cursor && !localTargets.claude && !localTargets.github

  const toggleTarget = (key: keyof ExportTargets) => {
    setLocalTargets((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const save = () => {
    const removedTargets = (["cursor", "claude", "github"] as const).filter(
      (t) => storeTargets[t] && !localTargets[t],
    )

    onSave({
      settings: {
        name: name.trim(),
        owner: {
          name: ownerName.trim(),
          email: ownerEmail.trim() || undefined,
        },
        metadata: {
          description: description.trim() || undefined,
          version: version.trim() || undefined,
        },
      },
      targets: localTargets,
      removedTargets,
    })
  }

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
            <Label htmlFor="mkt-owner" className="text-xs">
              Owner name
            </Label>
            <Input
              id="mkt-owner"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mkt-email" className="text-xs">
              Owner email
            </Label>
            <Input
              id="mkt-email"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="mkt-desc" className="text-xs">
            Description
          </Label>
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

        <div className="flex flex-col gap-2.5">
          <Label className="text-xs">Export to</Label>
          <div className="grid grid-cols-3 gap-3">
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleTarget("cursor")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  toggleTarget("cursor")
                }
              }}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2.5 transition-colors select-none ${
                localTargets.cursor
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-transparent opacity-60"
              }`}
            >
              <Checkbox
                checked={localTargets.cursor}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                onCheckedChange={() => toggleTarget("cursor")}
              />
              <Image
                src="/cursor.svg"
                alt="Cursor"
                width={16}
                height={16}
                className="shrink-0 dark:invert"
              />
              <span className="text-xs font-medium">Cursor</span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleTarget("claude")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  toggleTarget("claude")
                }
              }}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2.5 transition-colors select-none ${
                localTargets.claude
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-transparent opacity-60"
              }`}
            >
              <Checkbox
                checked={localTargets.claude}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                onCheckedChange={() => toggleTarget("claude")}
              />
              <Image
                src="/claude.svg"
                alt="Claude"
                width={16}
                height={16}
                className="shrink-0"
              />
              <span className="text-xs font-medium">Claude</span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleTarget("github")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  toggleTarget("github")
                }
              }}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2.5 transition-colors select-none ${
                localTargets.github
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-transparent opacity-60"
              }`}
            >
              <Checkbox
                checked={localTargets.github}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                onCheckedChange={() => toggleTarget("github")}
              />
              <Image
                src="/github.svg"
                alt="GitHub Copilot"
                width={16}
                height={16}
                className="shrink-0 dark:invert"
              />
              <span className="text-xs font-medium">GitHub</span>
            </div>
          </div>
          {noneSelected ? (
            <p className="text-[11px] text-destructive">
              Select at least one export target
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Controls which plugin folders are generated on export
            </p>
          )}
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
        <Button disabled={issues.length > 0 || noneSelected} onClick={save}>
          Save
        </Button>
      </DialogFooter>
    </>
  )
}

export function MarketplaceSettingsDialog({ open, onClose }: Props) {
  const marketplaceSettings = useWizardStore((s) => s.marketplaceSettings)
  const exportTargets = useWizardStore((s) => s.exportTargets)
  const refreshGitDefaults = useWizardStore((s) => s.refreshGitDefaults)
  const setMarketplaceSettings = useWizardStore((s) => s.setMarketplaceSettings)
  const setExportTargets = useWizardStore((s) => s.setExportTargets)
  const deleteExportFolders = useWizardStore((s) => s.deleteExportFolders)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<SavePayload | null>(null)

  useEffect(() => {
    if (open) refreshGitDefaults()
  }, [open, refreshGitDefaults])

  const commitSave = useCallback(
    async (payload: SavePayload, doDelete: boolean) => {
      if (doDelete && payload.removedTargets.length > 0) {
        const names = payload.removedTargets
          .map((t) => TARGET_LABELS[t])
          .join(" and ")
        await deleteExportFolders(payload.removedTargets)
        sonnerToast.success(`Removed ${names} configuration folders`)
      }

      setExportTargets(payload.targets)
      setMarketplaceSettings(payload.settings)
    },
    [deleteExportFolders, setExportTargets, setMarketplaceSettings],
  )

  const handleSave = useCallback(
    (payload: SavePayload) => {
      if (payload.removedTargets.length > 0) {
        setPendingPayload(payload)
        onClose()
        setTimeout(() => setConfirmOpen(true), 150)
        return
      }

      commitSave(payload, false)
      onClose()
    },
    [commitSave, onClose],
  )

  const handleConfirm = useCallback(async () => {
    if (!pendingPayload) return
    await commitSave(pendingPayload, true)
    setPendingPayload(null)
  }, [commitSave, pendingPayload])

  const handleConfirmCancel = useCallback(() => {
    setPendingPayload(null)
  }, [])

  const confirmLabel = pendingPayload?.removedTargets
    .map((t) => TARGET_LABELS[t])
    .join(" and ")
  const confirmFolders = pendingPayload?.removedTargets
    .map((t) => (t === "github" ? ".github/plugin" : `.${t}-plugin`))
    .join(" and ")

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose()
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <MarketplaceSettingsFormBody
            key={`${marketplaceSettings.name}|${marketplaceSettings.owner.name}|${exportTargets.cursor}|${exportTargets.claude}|${exportTargets.github}`}
            initial={marketplaceSettings}
            onSave={handleSave}
            onClose={onClose}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(isOpen) => {
          setConfirmOpen(isOpen)
          if (!isOpen) handleConfirmCancel()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Remove {confirmLabel} configurations?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {confirmFolders} folders from the
              marketplace root and every plugin directory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirm}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
