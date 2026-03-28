/**
 * Types aligned with Claude Code / Cursor marketplace.json and plugin entry docs.
 * We emit manifests from PluginData + MarketplaceSettings; runtime shapes match these types.
 */

/** Maintainer / team for the marketplace */
export interface MarketplaceOwner {
  /** Required */
  name: string
  /** Optional contact */
  email?: string
}

/**
 * Optional marketplace metadata.
 * `pluginRoot` is part of the spec but we always emit concrete `./plugins/...` paths
 * in this app — kept for documentation / external tooling only; do not read in UI/export logic.
 */
export interface MarketplaceMetadata {
  description?: string
  version?: string
  /** @deprecated in-app — spec field only; not used by Marketplace Wizard export */
  pluginRoot?: string
}

/** Plugin source in the manifest: path string or richer object (registry, git, etc.) */
export type PluginSource = string | Record<string, unknown>

export interface PluginAuthor {
  name: string
  email?: string
}

/**
 * One plugin entry in `marketplace.json` `plugins[]`.
 * Includes marketplace-specific + standard manifest fields.
 */
export interface MarketplacePluginEntry {
  name: string
  source: PluginSource
  description?: string
  version?: string
  author?: PluginAuthor
  homepage?: string
  repository?: string
  license?: string
  keywords?: string[]
  category?: string
  tags?: string[]
  strict?: boolean
}

/** Full marketplace manifest (`.claude-plugin/marketplace.json`, `.cursor-plugin/marketplace.json`, `.github/plugin/marketplace.json`, `.agents/plugins/marketplace.json`) */
export interface MarketplaceManifest {
  name: string
  owner: MarketplaceOwner
  plugins: MarketplacePluginEntry[]
  metadata?: MarketplaceMetadata
}

/** Editable marketplace-level settings used by the wizard (maps to manifest root + metadata) */
export interface MarketplaceSettings {
  /** Kebab-case marketplace id */
  name: string
  owner: MarketplaceOwner
  metadata: Pick<MarketplaceMetadata, "description" | "version">
}
