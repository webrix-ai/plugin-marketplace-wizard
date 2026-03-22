import { describe, it, expect } from "vitest"
import {
  mergePluginsWithManifest,
  settingsFromManifest,
} from "./merge-marketplace-manifest"
import type { PluginData } from "./types"
import type { MarketplaceManifest } from "./marketplace-schema"

const makePlugin = (overrides: Partial<PluginData> = {}): PluginData => ({
  id: "1",
  name: "test-plugin",
  slug: "test-plugin",
  description: "Original description",
  version: "1.0.0",
  mcps: [],
  skills: [],
  ...overrides,
})

describe("mergePluginsWithManifest", () => {
  it("returns plugins unchanged when manifest is null", () => {
    const plugins = [makePlugin()]
    expect(mergePluginsWithManifest(plugins, null)).toEqual(plugins)
  })

  it("returns plugins unchanged when manifest is undefined", () => {
    const plugins = [makePlugin()]
    expect(mergePluginsWithManifest(plugins, undefined)).toEqual(plugins)
  })

  it("returns plugins unchanged when manifest has no plugins", () => {
    const plugins = [makePlugin()]
    const manifest: MarketplaceManifest = {
      name: "test",
      owner: { name: "Owner" },
      plugins: [],
    }
    expect(mergePluginsWithManifest(plugins, manifest)).toEqual(plugins)
  })

  it("merges manifest entry fields into matching plugin", () => {
    const plugins = [makePlugin({ slug: "my-plugin" })]
    const manifest: MarketplaceManifest = {
      name: "test",
      owner: { name: "Owner" },
      plugins: [
        {
          name: "my-plugin",
          source: "./plugins/my-plugin",
          description: "Updated description",
          version: "2.0.0",
        },
      ],
    }

    const result = mergePluginsWithManifest(plugins, manifest)
    expect(result[0].description).toBe("Updated description")
    expect(result[0].version).toBe("2.0.0")
  })

  it("does not overwrite with undefined manifest fields", () => {
    const plugins = [makePlugin({ slug: "my-plugin", description: "Original" })]
    const manifest: MarketplaceManifest = {
      name: "test",
      owner: { name: "Owner" },
      plugins: [{ name: "my-plugin", source: "./plugins/my-plugin" }],
    }

    const result = mergePluginsWithManifest(plugins, manifest)
    expect(result[0].description).toBe("Original")
  })

  it("leaves unmatched plugins unchanged", () => {
    const plugins = [makePlugin({ slug: "unmatched" })]
    const manifest: MarketplaceManifest = {
      name: "test",
      owner: { name: "Owner" },
      plugins: [{ name: "other-plugin", source: "./plugins/other" }],
    }

    const result = mergePluginsWithManifest(plugins, manifest)
    expect(result[0]).toEqual(plugins[0])
  })

  it("normalizes source override - removes default path", () => {
    const plugins = [makePlugin({ slug: "my-plugin" })]
    const manifest: MarketplaceManifest = {
      name: "test",
      owner: { name: "Owner" },
      plugins: [{ name: "my-plugin", source: "./plugins/my-plugin" }],
    }

    const result = mergePluginsWithManifest(plugins, manifest)
    expect(result[0].sourceOverride).toBeUndefined()
  })

  it("preserves non-default source override", () => {
    const plugins = [makePlugin({ slug: "my-plugin" })]
    const manifest: MarketplaceManifest = {
      name: "test",
      owner: { name: "Owner" },
      plugins: [
        { name: "my-plugin", source: "https://example.com/plugin.git" },
      ],
    }

    const result = mergePluginsWithManifest(plugins, manifest)
    expect(result[0].sourceOverride).toBe("https://example.com/plugin.git")
  })
})

describe("settingsFromManifest", () => {
  it("extracts settings from manifest", () => {
    const manifest: MarketplaceManifest = {
      name: "my-marketplace",
      owner: { name: "John", email: "john@example.com" },
      plugins: [],
      metadata: { description: "A marketplace", version: "1.0.0" },
    }

    const settings = settingsFromManifest(manifest)
    expect(settings.name).toBe("my-marketplace")
    expect(settings.owner.name).toBe("John")
    expect(settings.owner.email).toBe("john@example.com")
    expect(settings.metadata.description).toBe("A marketplace")
    expect(settings.metadata.version).toBe("1.0.0")
  })

  it("handles manifest without metadata", () => {
    const manifest: MarketplaceManifest = {
      name: "my-marketplace",
      owner: { name: "John" },
      plugins: [],
    }

    const settings = settingsFromManifest(manifest)
    expect(settings.metadata.description).toBeUndefined()
    expect(settings.metadata.version).toBeUndefined()
  })
})
