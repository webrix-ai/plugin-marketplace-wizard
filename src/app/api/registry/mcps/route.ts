import { NextResponse } from "next/server"
import type { RegistryMcpServer } from "@/lib/types"

const REGISTRY_URL = "https://registry.modelcontextprotocol.io/v0.1/servers"
const PAGE_SIZE = 100
const CACHE_TTL_MS = 5 * 60 * 1000

interface CachedEntry {
  servers: { server: RegistryMcpServer; _meta: Record<string, unknown> }[]
  fetchedAt: number
}

let cache: CachedEntry | null = null

async function fetchAllServers(): Promise<CachedEntry["servers"]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.servers
  }

  const allServers: CachedEntry["servers"] = []
  let cursor: string | undefined
  let pages = 0
  const maxPages = 20

  while (pages < maxPages) {
    const url = new URL(REGISTRY_URL)
    url.searchParams.set("limit", String(PAGE_SIZE))
    if (cursor) url.searchParams.set("cursor", cursor)

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) break

    const data = await res.json()
    if (!data.servers?.length) break

    allServers.push(...data.servers)
    pages++

    if (data.metadata?.nextCursor) {
      cursor = data.metadata.nextCursor
    } else {
      break
    }
  }

  cache = { servers: allServers, fetchedAt: Date.now() }
  return allServers
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.toLowerCase() || ""
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")

    const allServers = await fetchAllServers()

    let filtered = allServers
    if (query) {
      filtered = allServers.filter((entry) => {
        const s = entry.server
        return (
          s.name?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.title?.toLowerCase().includes(query)
        )
      })
    }

    const deduped = new Map<string, (typeof filtered)[0]>()
    for (const entry of filtered) {
      const existing = deduped.get(entry.server.name)
      if (!existing || entry.server.version > (existing.server.version || "")) {
        deduped.set(entry.server.name, entry)
      }
    }

    const unique = Array.from(deduped.values())
    const paged = unique.slice(offset, offset + limit)

    return NextResponse.json({
      servers: paged.map((entry) => entry.server),
      total: unique.length,
      offset,
      limit,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Registry fetch failed",
        servers: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}
