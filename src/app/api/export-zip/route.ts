import JSZip from "jszip"
import { buildFileTree } from "@/lib/plugin-writer"
import type { ExportRequest } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const body: ExportRequest = await request.json()

    const tree = buildFileTree(body)

    if (tree.size === 0) {
      return new Response(JSON.stringify({ error: "No files to export" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const plugin = body.plugins[0]
    const slug = plugin
      ? plugin.slug ||
        plugin.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      : "plugin"

    const prefix = `plugins/${slug}/`

    const zip = new JSZip()
    for (const [filePath, content] of tree) {
      if (!filePath.startsWith("plugins/")) continue
      const relative = filePath.startsWith(prefix)
        ? filePath.slice(prefix.length)
        : filePath
      zip.file(relative, content)
    }

    if (zip.files && Object.keys(zip.files).length === 0) {
      return new Response(JSON.stringify({ error: "No plugin files found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const buf = await zip.generateAsync({ type: "nodebuffer" })
    const filename = `${slug}.zip`

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Export failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
