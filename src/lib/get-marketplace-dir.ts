import path from "path"

export function getMarketplaceDir(): string {
  const envDir = process.env.MARKETPLACE_DIR
  if (envDir) {
    return path.isAbsolute(envDir)
      ? envDir
      : path.resolve(process.cwd(), envDir)
  }
  return process.cwd()
}
