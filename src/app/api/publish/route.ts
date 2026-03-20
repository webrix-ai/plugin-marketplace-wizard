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

function toHttpsUrl(raw: string): string {
  const m = raw.match(/^git@([^:]+):(.+?)(?:\.git)?$/);
  if (m) return `https://${m[1]}/${m[2]}`;
  if (raw.startsWith("ssh://")) {
    try {
      const u = new URL(raw.replace(/^ssh:\/\//, "https://"));
      return u.toString().replace(/\/$/, "");
    } catch {
      /* keep original */
    }
  }
  return raw.replace(/\.git$/, "");
}

export async function GET() {
  const cwd = getMarketplaceDir();

  const isGit = git("git rev-parse --is-inside-work-tree", cwd);
  if (!isGit) {
    return NextResponse.json({ status: "no-git" });
  }

  const remoteUrl =
    git("git remote get-url origin", cwd) ||
    git("git config remote.origin.url", cwd);

  if (!remoteUrl) {
    return NextResponse.json({ status: "no-remote" });
  }

  return NextResponse.json({
    status: "ready",
    remoteUrl: toHttpsUrl(remoteUrl),
  });
}

export async function POST() {
  const cwd = getMarketplaceDir();

  const isGit = git("git rev-parse --is-inside-work-tree", cwd);
  if (!isGit) {
    return NextResponse.json({ error: "Not a git repository" }, { status: 400 });
  }

  const remoteUrl =
    git("git remote get-url origin", cwd) ||
    git("git config remote.origin.url", cwd);

  if (!remoteUrl) {
    return NextResponse.json(
      { error: "No remote origin configured" },
      { status: 400 }
    );
  }

  const status = git("git status --porcelain", cwd);
  if (!status) {
    return NextResponse.json({
      success: true,
      message: "Nothing to commit — working tree clean",
      remoteUrl: toHttpsUrl(remoteUrl),
    });
  }

  try {
    execSync("git add -A", { cwd, stdio: "ignore" });

    const diffStat = git("git diff --cached --stat", cwd) ?? "";
    const filesChanged = diffStat
      .split("\n")
      .filter((l) => l.includes("|"))
      .map((l) => l.trim().split(/\s+/)[0])
      .slice(0, 5);

    const summary =
      filesChanged.length > 0
        ? `Update marketplace: ${filesChanged.join(", ")}${filesChanged.length < diffStat.split("\n").filter((l) => l.includes("|")).length ? " and more" : ""}`
        : "Update marketplace configuration";

    execSync(`git commit -m "${summary}"`, { cwd, stdio: "ignore" });

    const branch =
      git("git symbolic-ref --short HEAD", cwd) ?? "main";
    execSync(`git push origin ${branch}`, {
      cwd,
      stdio: "ignore",
      timeout: 30000,
    });

    return NextResponse.json({
      success: true,
      message: `Pushed to ${branch}`,
      remoteUrl: toHttpsUrl(remoteUrl),
      branch,
      commitMessage: summary,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Push failed: ${msg}` }, { status: 500 });
  }
}
