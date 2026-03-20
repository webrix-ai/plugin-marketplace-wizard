import { NextResponse } from "next/server";
import { execSync } from "child_process";

function git(cmd: string): string | null {
  try {
    const out = execSync(cmd, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      cwd: process.cwd(),
    });
    const s = out.trim();
    return s || null;
  } catch {
    return null;
  }
}

export async function GET() {
  const userName = git("git config user.name");
  const userEmail = git("git config user.email");
  let remoteUrl =
    git("git remote get-url origin") ||
    git("git config remote.origin.url");

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
