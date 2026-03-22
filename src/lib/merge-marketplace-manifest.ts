import type {
  MarketplaceManifest,
  MarketplaceSettings,
  PluginSource,
} from "./marketplace-schema"
import type { PluginData } from "./types"

function normalizeSourceOverride(
  slug: string,
  source: PluginSource | undefined,
): string | Record<string, unknown> | undefined {
  if (source === undefined) return undefined
  if (typeof source === "string") {
    if (source === slug || source === `./plugins/${slug}`) return undefined
    return source
  }
  return source
}

export function mergePluginsWithManifest(
  plugins: PluginData[],
  manifest: MarketplaceManifest | null | undefined,
): PluginData[] {
  if (!manifest?.plugins?.length) return plugins
  const byName = new Map(manifest.plugins.map((p) => [p.name, p]))
  return plugins.map((pl) => {
    const entry = byName.get(pl.slug)
    if (!entry) return pl
    return {
      ...pl,
      description: entry.description ?? pl.description,
      version: entry.version ?? pl.version,
      author: entry.author
        ? { name: entry.author.name, email: entry.author.email }
        : pl.author,
      homepage: entry.homepage ?? pl.homepage,
      repository: entry.repository ?? pl.repository,
      license: entry.license ?? pl.license,
      keywords: entry.keywords ?? pl.keywords,
      category: entry.category ?? pl.category,
      tags: entry.tags ?? pl.tags,
      strict: entry.strict ?? pl.strict,
      sourceOverride: normalizeSourceOverride(pl.slug, entry.source),
    }
  })
}

export function settingsFromManifest(
  manifest: MarketplaceManifest,
): MarketplaceSettings {
  return {
    name: manifest.name,
    owner: {
      name: manifest.owner.name,
      email: manifest.owner.email,
    },
    metadata: {
      description: manifest.metadata?.description,
      version: manifest.metadata?.version,
    },
  }
}
