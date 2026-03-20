import fs from "fs";
import path from "path";
import { readPluginDir } from "@/lib/plugin-reader";
import { stripJsonComments } from "@/lib/utils";
import type { MarketplaceManifest } from "@/lib/marketplace-schema";

function tryReadManifest(outputDir: string): MarketplaceManifest | null {
  for (const sub of [".claude-plugin", ".cursor-plugin"]) {
    try {
      const raw = fs.readFileSync(
        path.join(outputDir, sub, "marketplace.json"),
        "utf-8"
      );
      const data = JSON.parse(stripJsonComments(raw)) as MarketplaceManifest;
      if (data?.name && data.owner && Array.isArray(data.plugins)) return data;
    } catch {
      /* next */
    }
  }
  return null;
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function slugFromPath(changedPath: string, pluginsDir: string): string | null {
  const rel = path.relative(pluginsDir, changedPath);
  if (rel.startsWith("..")) return null;
  const slug = rel.split(path.sep)[0];
  if (!slug || slug.startsWith(".")) return null;
  return slug;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dir = searchParams.get("dir") || "./marketplace-output";
  const outputDir = path.isAbsolute(dir)
    ? dir
    : path.resolve(process.cwd(), dir);
  const pluginsDir = path.join(outputDir, "plugins");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        } catch {
          // stream closed
        }
      };

      // Phase 1: stream manifest
      const manifest = tryReadManifest(outputDir);
      send("manifest", manifest);

      // Phase 2: stream each plugin individually
      if (fs.existsSync(pluginsDir)) {
        try {
          const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
          for (const entry of entries) {
            if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
            const plugin = readPluginDir(
              path.join(pluginsDir, entry.name),
              entry.name
            );
            if (plugin) send("plugin", plugin);
          }
        } catch {
          // skip
        }
      }

      send("done", {});

      // Phase 3: watch for file changes
      let watcher: fs.FSWatcher | null = null;
      const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

      function handleChange(slug: string) {
        const pluginPath = path.join(pluginsDir, slug);
        if (!fs.existsSync(pluginPath)) {
          send("plugin:removed", { slug });
          return;
        }
        const stat = fs.statSync(pluginPath);
        if (!stat.isDirectory()) return;
        const plugin = readPluginDir(pluginPath, slug);
        if (plugin) send("plugin:updated", plugin);
      }

      try {
        if (!fs.existsSync(pluginsDir)) {
          fs.mkdirSync(pluginsDir, { recursive: true });
        }

        watcher = fs.watch(
          pluginsDir,
          { recursive: true },
          (_eventType, filename) => {
            if (!filename) return;
            const slug = slugFromPath(
              path.join(pluginsDir, filename),
              pluginsDir
            );
            if (!slug) return;

            const existing = debounceTimers.get(slug);
            if (existing) clearTimeout(existing);
            debounceTimers.set(
              slug,
              setTimeout(() => {
                debounceTimers.delete(slug);
                handleChange(slug);
              }, 300)
            );
          }
        );
      } catch {
        // watch not supported or dir missing — streaming still works fine
      }

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        for (const t of debounceTimers.values()) clearTimeout(t);
        debounceTimers.clear();
        watcher?.close();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
