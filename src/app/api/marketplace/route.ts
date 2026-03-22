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
