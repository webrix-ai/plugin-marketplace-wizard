import type {
  MarketplaceManifest,
  MarketplacePluginEntry,
  MarketplaceSettings,
} from "./marketplace-schema";

export interface ValidationIssue {
  path: string;
  message: string;
}

export const RESERVED_MARKETPLACE_NAMES = new Set([
  "claude-code-marketplace",
  "claude-code-plugins",
  "claude-plugins-official",
  "anthropic-marketplace",
  "anthropic-plugins",
  "agent-skills",
  "life-sciences",
]);

/** Block obvious impersonation (substring / official-looking slugs) */
const IMPERSONATION_SUBSTRINGS = [
  "anthropic-official",
  "official-claude",
  "official-anthropic",
  "claude-official",
  "anthropic-tools-v",
  "claude-plugins-official",
];

const KEBAB_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidKebabCaseId(value: string): boolean {
  if (!value || value.length > 128) return false;
  return KEBAB_PATTERN.test(value);
}

function looksLikeImpersonation(name: string): boolean {
  const lower = name.toLowerCase();
  if (IMPERSONATION_SUBSTRINGS.some((s) => lower.includes(s))) return true;
  if (/^official[-_]/i.test(lower)) return true;
  return false;
}

const EMAIL_LOOSE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateMarketplaceName(name: string): ValidationIssue | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return { path: "name", message: "Marketplace name is required" };
  }
  if (!isValidKebabCaseId(trimmed)) {
    return {
      path: "name",
      message: "Marketplace name must be kebab-case (lowercase letters, numbers, hyphens only)",
    };
  }
  if (RESERVED_MARKETPLACE_NAMES.has(trimmed)) {
    return { path: "name", message: `"${trimmed}" is reserved for official use` };
  }
  if (looksLikeImpersonation(trimmed)) {
    return {
      path: "name",
      message: "This name appears to impersonate an official marketplace",
    };
  }
  return null;
}

export function validateOwner(owner: MarketplaceSettings["owner"]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!owner.name?.trim()) {
    issues.push({ path: "owner.name", message: "Owner name is required" });
  }
  if (owner.email?.trim() && !EMAIL_LOOSE.test(owner.email.trim())) {
    issues.push({ path: "owner.email", message: "Invalid email format" });
  }
  return issues;
}

export function validatePluginEntry(
  entry: Partial<MarketplacePluginEntry>,
  index: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const pfx = `plugins[${index}]`;
  if (!entry.name?.trim()) {
    issues.push({ path: `${pfx}.name`, message: "Plugin name is required" });
  } else if (!isValidKebabCaseId(entry.name.trim())) {
    issues.push({
      path: `${pfx}.name`,
      message: "Plugin name must be kebab-case",
    });
  }
  if (entry.source === undefined || entry.source === "") {
    issues.push({ path: `${pfx}.source`, message: "Plugin source is required" });
  }
  if (entry.author && !entry.author.name?.trim()) {
    issues.push({ path: `${pfx}.author.name`, message: "Author name is required when author is set" });
  }
  if (entry.author?.email?.trim() && !EMAIL_LOOSE.test(entry.author.email.trim())) {
    issues.push({ path: `${pfx}.author.email`, message: "Invalid author email" });
  }
  return issues;
}

export function validateMarketplaceSettings(settings: MarketplaceSettings): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const n = validateMarketplaceName(settings.name);
  if (n) issues.push(n);
  issues.push(...validateOwner(settings.owner));
  return issues;
}

export function validateMarketplaceManifest(manifest: MarketplaceManifest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  issues.push(...validateMarketplaceSettings({
    name: manifest.name,
    owner: manifest.owner,
    metadata: {
      description: manifest.metadata?.description,
      version: manifest.metadata?.version,
    },
  }));
  manifest.plugins?.forEach((p, i) => {
    issues.push(...validatePluginEntry(p, i));
  });
  return issues;
}
