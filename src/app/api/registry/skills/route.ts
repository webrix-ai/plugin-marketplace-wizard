import { NextResponse } from "next/server"

const SKILLS_API = "https://skills.sh/api/search"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100)

    if (!query) {
      return NextResponse.json({ skills: [], query: "", count: 0 })
    }

    const url = new URL(SKILLS_API)
    url.searchParams.set("q", query)
    url.searchParams.set("limit", String(limit))

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      throw new Error(`skills.sh returned ${res.status}`)
    }

    const data = await res.json()

    return NextResponse.json({
      skills: data.skills || [],
      query: data.query || query,
      count: data.count || 0,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Skills search failed",
        skills: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}
