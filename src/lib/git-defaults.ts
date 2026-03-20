import type { GitDefaults } from "./store";
import type { PluginAuthorData } from "./types";

export function authorFromGit(git: GitDefaults | null): {
  author?: PluginAuthorData;
  repository?: string;
} {
  if (!git?.userName) return {};
  return {
    author: {
      name: git.userName,
      email: git.userEmail || undefined,
    },
    ...(git.remoteUrl ? { repository: git.remoteUrl } : {}),
  };
}
