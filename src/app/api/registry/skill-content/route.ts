import { NextResponse } from "next/server";

interface GitTreeEntry {
  path: string;
  mode: string;
  type: string;
  sha: string;
  url: string;
}

interface GitTreeResponse {
  sha: string;
  tree: GitTreeEntry[];
  truncated: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const skillName = searchParams.get("skill");

    if (!source || !skillName) {
      return NextResponse.json(
        { error: "Both 'source' (owner/repo) and 'skill' (skill name) are required" },
        { status: 400 }
      );
    }

    const match = source.match(/^([^/]+)\/([^/]+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid source format. Expected owner/repo" },
        { status: 400 }
      );
    }

    const [, owner, repo] = match;

    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "marketplace-wizard",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!treeRes.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${treeRes.status} ${treeRes.statusText}` },
        { status: 502 }
      );
    }

    const tree: GitTreeResponse = await treeRes.json();

    const skillMdPaths = tree.tree
      .filter((e) => e.type === "blob" && e.path.endsWith("/SKILL.md"))
      .map((e) => e.path);

    if (skillMdPaths.length === 0) {
      return NextResponse.json(
        { error: "No SKILL.md files found in repository" },
        { status: 404 }
      );
    }

    const normalizedName = skillName.toLowerCase();
    let bestPath: string | null = null;

    for (const p of skillMdPaths) {
      const dirName = p.split("/").slice(-2, -1)[0]?.toLowerCase() || "";
      if (dirName === normalizedName) {
        bestPath = p;
        break;
      }
    }

    if (!bestPath) {
      for (const p of skillMdPaths) {
        const dirName = p.split("/").slice(-2, -1)[0]?.toLowerCase() || "";
        if (dirName.includes(normalizedName) || normalizedName.includes(dirName)) {
          bestPath = p;
          break;
        }
      }
    }

    if (!bestPath) {
      const defaultBranch = await getDefaultBranch(owner!, repo!);
      const results = await fetchAndMatchByFrontmatter(
        owner!,
        repo!,
        defaultBranch,
        skillMdPaths,
        normalizedName
      );
      if (results) {
        return NextResponse.json(results);
      }

      return NextResponse.json(
        {
          error: `Skill "${skillName}" not found in repository`,
          availablePaths: skillMdPaths,
        },
        { status: 404 }
      );
    }

    const defaultBranch = await getDefaultBranch(owner!, repo!);

    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${bestPath}`;
    const contentRes = await fetch(rawUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!contentRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch SKILL.md content: ${contentRes.status}` },
        { status: 502 }
      );
    }

    const content = await contentRes.text();

    const skillDir = bestPath.replace(/\/SKILL\.md$/, "");
    const siblingEntries = tree.tree
      .filter((e) => e.type === "blob" && e.path.startsWith(skillDir + "/") && e.path !== bestPath);

    const editableExts = new Set([
      ".md", ".json", ".yaml", ".yml", ".txt", ".sh", ".bash",
      ".js", ".ts", ".mjs", ".cjs", ".py", ".rb", ".toml", ".cfg", ".ini", ".xml",
      ".html", ".css", ".env", ".example",
    ]);

    const editableSiblings = siblingEntries.filter((e) => {
      const ext = "." + (e.path.split(".").pop()?.toLowerCase() ?? "");
      return editableExts.has(ext);
    });

    const skillFiles: { relativePath: string; content: string }[] = [];
    if (editableSiblings.length > 0 && editableSiblings.length <= 30) {
      const fetches = editableSiblings.map(async (e) => {
        const relativePath = e.path.slice(skillDir.length + 1);
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${e.path}`;
          const res = await fetch(rawUrl, { signal: AbortSignal.timeout(5000) });
          if (!res.ok) return null;
          const text = await res.text();
          if (text.length > 100_000) return null;
          return { relativePath, content: text };
        } catch {
          return null;
        }
      });
      const results = await Promise.allSettled(fetches);
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          skillFiles.push(r.value);
        }
      }
    }

    return NextResponse.json({
      content,
      path: bestPath,
      skillDir,
      source,
      repository: `https://github.com/${owner}/${repo}`,
      siblingFiles: siblingEntries.map((e) => ({
        path: e.path.slice(skillDir.length + 1),
        sha: e.sha,
      })),
      skillFiles,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch skill content",
      },
      { status: 500 }
    );
  }
}

async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "marketplace-wizard",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.default_branch || "main";
    }
  } catch {}
  return "main";
}

async function fetchAndMatchByFrontmatter(
  owner: string,
  repo: string,
  branch: string,
  paths: string[],
  normalizedName: string
): Promise<{
  content: string;
  path: string;
  skillDir: string;
  source: string;
  repository: string;
} | null> {
  const toCheck = paths.slice(0, 10);

  const results = await Promise.allSettled(
    toCheck.map(async (p) => {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${p}`;
      const res = await fetch(rawUrl, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const content = await res.text();
      return { path: p, content };
    })
  );

  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value) continue;
    const { path, content } = result.value;

    const nameMatch = content.match(/^name:\s*["']?(.+?)["']?\s*$/m);
    if (nameMatch && nameMatch[1]?.toLowerCase().trim() === normalizedName) {
      const skillDir = path.replace(/\/SKILL\.md$/, "");
      return {
        content,
        path,
        skillDir,
        source: `${owner}/${repo}`,
        repository: `https://github.com/${owner}/${repo}`,
      };
    }
  }

  return null;
}
