import { NextResponse } from "next/server";
import { exportPlugins } from "@/lib/plugin-writer";
import type { ExportRequest } from "@/lib/types";
import { getMarketplaceDir } from "@/lib/get-marketplace-dir";

export async function POST(request: Request) {
  try {
    const body: ExportRequest = await request.json();
    const outputDir = getMarketplaceDir();

    const result = await exportPlugins({
      ...body,
      outputDir,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        outputDir: "",
        pluginCount: 0,
        files: [],
        error: error instanceof Error ? error.message : "Export failed",
      },
      { status: 500 }
    );
  }
}
