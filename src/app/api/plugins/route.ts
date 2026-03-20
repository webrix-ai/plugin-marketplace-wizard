import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { readAllPlugins } from "@/lib/plugin-reader";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dir = searchParams.get("dir") || "./marketplace-output";
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
    }

    const outputDir = path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
    const pluginDir = path.join(outputDir, "plugins", slug);

    if (!fs.existsSync(pluginDir)) {
      return NextResponse.json({ success: true, deleted: false });
    }

    fs.rmSync(pluginDir, { recursive: true, force: true });

    const manifestPath = path.join(outputDir, ".cursor-plugin", "marketplace.json");
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        if (Array.isArray(manifest.plugins)) {
          manifest.plugins = manifest.plugins.filter(
            (p: { name?: string }) => p.name !== slug
          );
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        }
      } catch {
        // manifest cleanup is best-effort
      }
    }

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dir = searchParams.get("dir") || "./marketplace-output";

    const outputDir = path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
    const plugins = readAllPlugins(outputDir);

    return NextResponse.json({ plugins });
  } catch (error) {
    return NextResponse.json(
      { plugins: [], error: error instanceof Error ? error.message : "Failed to load plugins" },
      { status: 500 }
    );
  }
}
