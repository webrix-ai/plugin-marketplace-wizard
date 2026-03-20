import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { getMarketplaceDir } from "@/lib/get-marketplace-dir";

function git(cmd: string, cwd: string): string | null {
  try {
    const out = execSync(cmd, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      cwd,
    });
    const s = out.trim();
    return s || null;
  } catch {
    return null;
  }
}

export async function GET() {
  const cwd = getMarketplaceDir();
  const userName = git("git config user.name", cwd);
  const userEmail = git("git config user.email", cwd);
  let remoteUrl =
    git("git remote get-url origin", cwd) ||
    git("git config remote.origin.url", cwd);

  if (remoteUrl) {
    const m = remoteUrl.match(/^git@([^:]+):(.+?)(?:\.git)?$/);
    if (m) remoteUrl = `https://${m[1]}/${m[2]}`;
    else if (remoteUrl.startsWith("ssh://")) {
      try {
        const u = new URL(remoteUrl.replace(/^ssh:\/\//, "https://"));
        remoteUrl = u.toString().replace(/\/$/, "");
      } catch {
        /* keep */
      }
    }
  }

  return NextResponse.json({
    userName,
    userEmail,
    remoteUrl,
  });
}
