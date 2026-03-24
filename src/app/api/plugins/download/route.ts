import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import os from "os"
import path from "path"
import archiver from "archiver"
import { Readable } from "stream"
import { getMarketplaceDir } from "@/lib/get-marketplace-dir"
import { readPluginDir } from "@/lib/plugin-reader"
import type { ExportTargets } from "@/lib/types"
import { exportPlugins } from "@/lib/plugin-writer"

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")
  const platform = request.nextUrl.searchParams.get("platform")

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 })
  }

  if (!platform || !["cursor", "claude", "github"].includes(platform)) {
    return NextResponse.json(
      { error: "Missing or invalid platform parameter (cursor, claude, github)" },
      { status: 400 },
    )
  }

  const marketplaceDir = getMarketplaceDir()
  const pluginDir = path.join(marketplaceDir, "plugins", slug)

  if (!fs.existsSync(pluginDir)) {
    return NextResponse.json({ error: `Plugin "${slug}" not found` }, { status: 404 })
  }

  const plugin = readPluginDir(pluginDir, slug)
  if (!plugin) {
    return NextResponse.json({ error: `Could not read plugin "${slug}"` }, { status: 500 })
  }

  const targets: ExportTargets = {
    cursor: platform === "cursor",
    claude: platform === "claude",
    github: platform === "github",
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pmw-download-"))

  try {
    const result = await exportPlugins({
      outputDir: tmpDir,
      plugins: [plugin],
      exportTargets: targets,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Export failed" }, { status: 500 })
    }

    const archive = archiver("zip", { zlib: { level: 6 } })
    const pluginOutputDir = path.join(tmpDir, "plugins", slug)

    if (fs.existsSync(pluginOutputDir)) {
      archive.directory(pluginOutputDir, slug)
    }

    archive.finalize()

    const readableStream = Readable.toWeb(archive) as ReadableStream<Uint8Array>

    return new Response(readableStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${slug}-${platform}.zip"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Download failed" },
      { status: 500 },
    )
  } finally {
    setTimeout(() => {
      fs.rm(tmpDir, { recursive: true, force: true }, () => {})
    }, 5000)
  }
}
