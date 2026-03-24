import { NextResponse } from "next/server";
import { scanHooks } from "@/lib/hook-scanner";
import {
  addClaudeHook,
  deleteClaudeHook,
  updateClaudeHook,
  addCursorHook,
  updateCursorHook,
  deleteCursorHook,
  getDefaultClaudeHookPath,
  getDefaultCursorHookPath,
} from "@/lib/hook-writer";
import type { ClaudeHookItem, CursorHookItem } from "@/lib/types";

export async function GET() {
  try {
    const result = await scanHooks();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scan failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      platform: "claude" | "cursor";
      item: Omit<ClaudeHookItem, "id"> | Omit<CursorHookItem, "id">;
      filePath?: string;
    };
    const { platform, item, filePath } = body;

    const targetPath =
      filePath ??
      (platform === "claude"
        ? getDefaultClaudeHookPath(item.scope)
        : getDefaultCursorHookPath(item.scope));

    if (platform === "claude") {
      addClaudeHook(item as Omit<ClaudeHookItem, "id">, targetPath);
    } else {
      addCursorHook(item as Omit<CursorHookItem, "id">, targetPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as {
      platform: "claude" | "cursor";
      item: ClaudeHookItem | CursorHookItem;
      updates: Partial<ClaudeHookItem | CursorHookItem>;
    };
    const { platform, item, updates } = body;

    if (platform === "claude") {
      updateClaudeHook(item as ClaudeHookItem, updates as Partial<ClaudeHookItem>);
    } else {
      updateCursorHook(item as CursorHookItem, updates as Partial<CursorHookItem>);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json() as {
      platform: "claude" | "cursor";
      item: ClaudeHookItem | CursorHookItem;
    };
    const { platform, item } = body;

    if (platform === "claude") {
      deleteClaudeHook(item as ClaudeHookItem);
    } else {
      deleteCursorHook(item as CursorHookItem);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
