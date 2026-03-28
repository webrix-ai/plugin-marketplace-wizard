import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { stripJsonComments } from "@/lib/utils"
import type { MarketplaceManifest } from "@/lib/marketplace-schema"
import { getMarketplaceDir } from "@/lib/get-marketplace-dir"

function tryReadManifest(outputDir: string): MarketplaceManifest | null {
  const candidates = [
    path.join(outputDir, ".claude-plugin", "marketplace.json"),
    path.join(outputDir, ".cursor-plugin", "marketplace.json"),
    path.join(outputDir, ".github", "plugin", "marketplace.json"),
  ]
  for (const p of candidates) {
    try {
      const raw = fs.readFileSync(p, "utf-8")
      const data = JSON.parse(stripJsonComments(raw)) as MarketplaceManifest
      if (data?.name && data.owner && Array.isArray(data.plugins)) return data
    } catch {
      /* next */
    }
  }

  const codexPath = path.join(outputDir, ".agents", "plugins", "marketplace.json")
  try {
    const raw = fs.readFileSync(codexPath, "utf-8")
    const data = JSON.parse(stripJsonComments(raw)) as Record<string, unknown>
    if (data?.name && Array.isArray(data.plugins)) {
      const iface = data.interface as Record<string, unknown> | undefined
      return {
        name: data.name as string,
        owner: { name: (iface?.displayName as string) || (data.name as string) },
        plugins: (data.plugins as MarketplaceManifest["plugins"]).map((p) => {
          const src = p.source as Record<string, unknown> | undefined
          return {
            ...p,
            source: (src?.path as string) || p.source,
          }
        }),
      }
    }
  } catch {
    /* skip */
  }

  return null
}

export async function GET() {
  try {
    const outputDir = getMarketplaceDir()
    const manifest = tryReadManifest(outputDir)
    return NextResponse.json({ manifest })
  } catch (error) {
    return NextResponse.json(
      {
        manifest: null,
        error: error instanceof Error ? error.message : "Failed",
      },
      { status: 500 },
    )
  }
}
