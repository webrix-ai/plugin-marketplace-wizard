"use client"

import { useState } from "react"
import Image from "next/image"
import { Download, Loader2 } from "lucide-react"
import { toast as sonnerToast } from "sonner"
import { useWizardStore } from "@/lib/store"
import type { ExportTargets } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Props {
  open: boolean
  onClose: () => void
  pluginSlug: string
  pluginName: string
}

const PLATFORMS = [
  {
    key: "cursor" as const,
    label: "Cursor",
    icon: "/cursor.svg",
    invert: true,
  },
  {
    key: "claude" as const,
    label: "Claude",
    icon: "/claude.svg",
    invert: false,
  },
  {
    key: "github" as const,
    label: "GitHub Copilot",
    icon: "/github.svg",
    invert: true,
  },
]

function triggerDownload(slug: string, platform: string) {
  const url = `/api/plugins/download?slug=${encodeURIComponent(slug)}&platform=${encodeURIComponent(platform)}`
  const a = document.createElement("a")
  a.href = url
  a.download = `${slug}-${platform}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function downloadPlugin(
  slug: string,
  name: string,
  exportTargets: ExportTargets,
) {
  const enabledPlatforms = PLATFORMS.filter((p) => exportTargets[p.key])

  if (enabledPlatforms.length === 0) {
    sonnerToast.error("No export platforms are enabled")
    return null
  }

  if (enabledPlatforms.length === 1) {
    triggerDownload(slug, enabledPlatforms[0].key)
    sonnerToast.success(`Downloading ${name} for ${enabledPlatforms[0].label}`)
    return null
  }

  return { slug, name }
}

export function DownloadPluginDialog({
  open,
  onClose,
  pluginSlug,
  pluginName,
}: Props) {
  const exportTargets = useWizardStore((s) => s.exportTargets)
  const [downloading, setDownloading] = useState<string | null>(null)

  const enabledPlatforms = PLATFORMS.filter((p) => exportTargets[p.key])

  const handleDownload = async (platform: string, label: string) => {
    setDownloading(platform)
    try {
      triggerDownload(pluginSlug, platform)
      sonnerToast.success(`Downloading ${pluginName} for ${label}`)
      onClose()
    } finally {
      setDownloading(null)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Download className="size-3.5 text-primary" />
            </div>
            <div>
              <DialogTitle>Download plugin</DialogTitle>
              <DialogDescription>
                Choose a platform for <strong>{pluginName}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {enabledPlatforms.map((platform) => (
            <Button
              key={platform.key}
              variant="outline"
              className="h-11 justify-start gap-3"
              disabled={downloading !== null}
              onClick={() => handleDownload(platform.key, platform.label)}
            >
              {downloading === platform.key ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Image
                  src={platform.icon}
                  alt={platform.label}
                  width={18}
                  height={18}
                  className={`shrink-0 ${platform.invert ? "dark:invert" : ""}`}
                />
              )}
              <span className="text-sm font-medium">{platform.label}</span>
            </Button>
          ))}
        </div>

        <DialogFooter showCloseButton>
          {/* close button injected by showCloseButton */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
