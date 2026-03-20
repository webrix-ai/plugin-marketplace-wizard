import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getMarketplaceDir } from "@/lib/get-marketplace-dir";

export async function GET() {
  const dir = getMarketplaceDir();
  const cursor = fs.existsSync(path.join(dir, ".cursor-plugin"));
  const claude = fs.existsSync(path.join(dir, ".claude-plugin"));
  return NextResponse.json({ cursor, claude });
}

function rmRecursive(dirPath: string) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

export async function DELETE(request: Request) {
  try {
    const { targets }: { targets: string[] } = await request.json();
    const dir = getMarketplaceDir();
    const deleted: string[] = [];

    for (const target of targets) {
      const folderName =
        target === "cursor" ? ".cursor-plugin" : ".claude-plugin";

      const rootFolder = path.join(dir, folderName);
      rmRecursive(rootFolder);
      deleted.push(rootFolder);

      const pluginsDir = path.join(dir, "plugins");
      if (fs.existsSync(pluginsDir)) {
        for (const slug of fs.readdirSync(pluginsDir)) {
          const pluginTarget = path.join(pluginsDir, slug, folderName);
          rmRecursive(pluginTarget);
          deleted.push(pluginTarget);
        }
      }
    }

    return NextResponse.json({ success: true, deleted });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
