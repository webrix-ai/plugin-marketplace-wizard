// Core domain types
export type {
  McpServer,
  SkillFile,
  Skill,
  AgentData,
  PluginAuthorData,
  PluginData,
  ScanResult,
  DragItemType,
  DragPayload,
  ExportTargets,
  ExportRequest,
  ExportResult,
  RegistryMcpServer,
  RegistryMcpResult,
  RegistrySkillEntry,
  RegistrySkillResult,
  GitDefaults,
  CustomRegistry,
  CustomGitHubSkill,
  CustomSkillRepo,
  PluginScalarUpdate,
} from "./lib/types"

// Marketplace schema types
export type {
  MarketplaceOwner,
  MarketplaceMetadata,
  PluginSource,
  PluginAuthor,
  MarketplacePluginEntry,
  MarketplaceManifest,
  MarketplaceSettings,
} from "./lib/marketplace-schema"

// Validation types and utilities
export type { ValidationIssue } from "./lib/validate-marketplace"
export {
  validateMarketplaceName,
  validateOwner,
  validatePluginEntry,
  validateMarketplaceSettings,
  validateMarketplaceManifest,
  validateMcpServer,
  validateSkill,
  validateAgent,
  validatePluginData,
  isValidKebabCaseId,
  getSkillDirName,
  RESERVED_MARKETPLACE_NAMES,
} from "./lib/validate-marketplace"
