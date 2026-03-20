import type { MarketplaceSettings } from "./marketplace-schema";
import { slugify } from "./utils";

export function createDefaultMarketplaceSettings(
  gitName?: string | null,
  gitEmail?: string | null
): MarketplaceSettings {
  const base = gitName?.trim() || "my-org";
  const slug = slugify(base);
  return {
    name: `${slug}-marketplace`,
    owner: {
      name: base,
      email: gitEmail?.trim() || undefined,
    },
    metadata: {
      description: `Plugin marketplace for ${base}`,
      version: "1.0.0",
    },
  };
}
