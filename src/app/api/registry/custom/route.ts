import { NextResponse } from "next/server"
import type { RegistryMcpServer } from "@/lib/types"

const PAGE_SIZE = 100
const MAX_PAGES = 10

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const registryUrl = searchParams.get("registryUrl")
    const query = searchParams.get("q")?.toLowerCase() || ""
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)

    if (!registryUrl) {
      return NextResponse.json(
        { error: "registryUrl parameter is required", servers: [], total: 0 },
        { status: 400 },
      )
    }

    let baseUrl: URL
    try {
      baseUrl = new URL(registryUrl)
    } catch {
      return NextResponse.json(
        { error: "Invalid registry URL", servers: [], total: 0 },
        { status: 400 },
      )
    }

    const allServers: {
      server: RegistryMcpServer
      _meta: Record<string, unknown>
    }[] = []
    let cursor: string | undefined

    for (let page = 0; page < MAX_PAGES; page++) {
      const url = new URL("/v0.1/servers", baseUrl.origin)
      url.searchParams.set("limit", String(PAGE_SIZE))
      if (query) url.searchParams.set("search", query)
      if (cursor) url.searchParams.set("cursor", cursor)

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) {
        if (page === 0) {
          return NextResponse.json(
            {
              error: `Registry returned ${res.status}: ${res.statusText}`,
              servers: [],
              total: 0,
            },
            { status: 502 },
          )
        }
        break
      }

      const data = await res.json()
      if (!data.servers?.length) break

      allServers.push(...data.servers)

      if (data.metadata?.nextCursor) {
        cursor = data.metadata.nextCursor
      } else {
        break
      }
    }

    const deduped = new Map<string, (typeof allServers)[0]>()
    for (const entry of allServers) {
      const existing = deduped.get(entry.server.name)
      if (!existing || entry.server.version > (existing.server.version || "")) {
        deduped.set(entry.server.name, entry)
      }
    }

    const unique = Array.from(deduped.values())
    const paged = unique.slice(0, limit)

    return NextResponse.json({
      servers: paged.map((entry) => entry.server),
      total: unique.length,
      registryUrl,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Custom registry fetch failed",
        servers: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}
