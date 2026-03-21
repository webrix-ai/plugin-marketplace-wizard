import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const exec = promisify(execFile);

interface SkillFileEntry {
  relativePath: string;
  content: string;
}

interface ParsedSkill {
  name: string;
  description: string;
  dirName: string;
  content: string;
  source: string;
  repository: string;
  files: SkillFileEntry[];
}

const EDITABLE_EXTENSIONS = new Set([
  ".md", ".json", ".yaml", ".yml", ".txt", ".sh", ".bash",
  ".js", ".ts", ".mjs", ".cjs", ".py", ".rb", ".toml", ".cfg", ".ini", ".xml",
  ".html", ".css", ".env", ".example",
]);

const MAX_SKILL_FILE_SIZE = 100_000;

async function collectEditableFiles(dir: string, prefix = ""): Promise<SkillFileEntry[]> {
  const results: SkillFileEntry[] = [];
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return results;
  }
  for (const name of entries) {
    if (name.startsWith(".")) continue;
    const fullPath = join(dir, name);
    const relativePath = prefix ? `${prefix}/${name}` : name;
    const s = await stat(fullPath).catch(() => null);
    if (!s) continue;
    if (s.isDirectory()) {
      results.push(...await collectEditableFiles(fullPath, relativePath));
    } else if (s.isFile() && relativePath !== "SKILL.md") {
      const ext = "." + (name.split(".").pop()?.toLowerCase() ?? "");
      if (!EDITABLE_EXTENSIONS.has(ext)) continue;
      if (s.size > MAX_SKILL_FILE_SIZE) continue;
      try {
        const content = await readFile(fullPath, "utf-8");
        results.push({ relativePath, content });
      } catch { /* skip */ }
    }
  }
  return results;
}

function parseSkillMd(content: string): { name: string; description: string } {
  const nameMatch = content.match(/^name:\s*["']?(.+?)["']?\s*$/m);
  const descMatch = content.match(/^description:\s*["']?(.+?)["']?\s*$/m);

  let name = nameMatch?.[1]?.trim() ?? "";
  let description = descMatch?.[1]?.trim() ?? "";

  if (!name) {
    const headingMatch = content.match(/^#\s+(.+)$/m);
    name = headingMatch?.[1]?.trim() ?? "";
  }

  if (!description && !descMatch) {
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed &&
        !trimmed.startsWith("#") &&
        !trimmed.startsWith("name:") &&
        !trimmed.startsWith("description:") &&
        !trimmed.startsWith("---")
      ) {
        description = trimmed;
        break;
      }
    }
  }

  return { name, description };
}

/**
 * Normalise various repo URL formats into clone URLs.
 * Returns SSH as primary (uses user's SSH keys for private repos)
 * and HTTPS as fallback.
 *
 * Accepted inputs:
 *   owner/repo                          → git@github.com:owner/repo.git
 *   github.com/owner/repo              → git@github.com:owner/repo.git
 *   https://github.com/owner/repo      → git@github.com:owner/repo.git
 *   https://github.com/owner/repo.git  → git@github.com:owner/repo.git
 *   git@github.com:owner/repo.git      → as-is
 *   Any other https:// or git:// URL   → as-is (no SSH conversion)
 */
function toCloneUrls(raw: string): { sshUrl: string | null; httpsUrl: string; display: string } {
  const trimmed = raw.trim().replace(/\/+$/, "");

  // Already SSH
  if (/^git@/.test(trimmed)) {
    const httpsUrl = trimmed.replace(/^git@([^:]+):/, "https://$1/");
    return { sshUrl: trimmed, httpsUrl, display: trimmed };
  }

  if (/^git:\/\//.test(trimmed)) {
    return { sshUrl: null, httpsUrl: trimmed, display: trimmed };
  }

  // Full https URL — extract host + path for SSH conversion
  const httpsMatch = trimmed.match(/^https?:\/\/([^/]+)\/(.+?)(?:\.git)?$/);
  if (httpsMatch) {
    const [, host, path] = httpsMatch;
    const httpsUrl = `https://${host}/${path}.git`;
    const sshUrl = `git@${host}:${path}.git`;
    return { sshUrl, httpsUrl, display: trimmed };
  }

  // github.com/owner/repo  (no scheme)
  const noScheme = trimmed.match(/^(github\.com)\/(.+?)(?:\.git)?$/);
  if (noScheme) {
    const [, host, path] = noScheme;
    return {
      sshUrl: `git@${host}:${path}.git`,
      httpsUrl: `https://${host}/${path}.git`,
      display: `https://${host}/${path}`,
    };
  }

  // owner/repo shorthand → GitHub
  if (/^[^/]+\/[^/]+$/.test(trimmed)) {
    return {
      sshUrl: `git@github.com:${trimmed}.git`,
      httpsUrl: `https://github.com/${trimmed}.git`,
      display: `https://github.com/${trimmed}`,
    };
  }

  return { sshUrl: null, httpsUrl: trimmed, display: trimmed };
}

function extractOwnerRepo(display: string): { owner: string; repo: string } {
  const m = display.replace(/\.git$/, "").match(/github\.com[/:]([^/]+)\/([^/]+)/);
  if (m) return { owner: m[1], repo: m[2] };
  const short = display.replace(/\.git$/, "").match(/^([^/]+)\/([^/]+)$/);
  if (short) return { owner: short[1], repo: short[2] };
  return { owner: "", repo: "" };
}

export async function GET(request: Request) {
  let tmpDir: string | null = null;

  try {
    const { searchParams } = new URL(request.url);
    const repoUrl = searchParams.get("repo");

    if (!repoUrl) {
      return NextResponse.json(
        { error: "'repo' parameter is required (GitHub URL or owner/repo)" },
        { status: 400 },
      );
    }

    const { sshUrl, httpsUrl, display } = toCloneUrls(repoUrl);
    const { owner, repo } = extractOwnerRepo(display);

    tmpDir = await mkdtemp(join(tmpdir(), "mw-skills-"));

    const cloneArgs = ["clone", "--depth", "1", "--filter=blob:none", "--sparse"];

    let cloned = false;

    // Try SSH first (works with private repos via user's SSH keys)
    if (sshUrl) {
      try {
        await exec("git", [...cloneArgs, sshUrl, tmpDir], { timeout: 30_000 });
        cloned = true;
      } catch {
        // SSH failed — clean the temp dir for the HTTPS retry
        await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        tmpDir = await mkdtemp(join(tmpdir(), "mw-skills-"));
      }
    }

    // Fall back to HTTPS
    if (!cloned) {
      try {
        await exec("git", [...cloneArgs, httpsUrl, tmpDir], { timeout: 30_000 });
      } catch (cloneErr: unknown) {
        const msg = cloneErr instanceof Error ? cloneErr.message : String(cloneErr);
        return NextResponse.json(
          { error: `Failed to clone repository: ${msg}` },
          { status: 502 },
        );
      }
    }

    try {
      await exec("git", ["sparse-checkout", "set", "skills"], {
        cwd: tmpDir,
        timeout: 15_000,
      });
    } catch {
      return NextResponse.json(
        { error: "No skills/ folder found in repository root" },
        { status: 404 },
      );
    }

    const skillsDir = join(tmpDir, "skills");
    let entries: string[];
    try {
      entries = await readdir(skillsDir);
    } catch {
      return NextResponse.json(
        { error: "No skills/ folder found in repository root" },
        { status: 404 },
      );
    }

    const skills: ParsedSkill[] = [];

    for (const dirName of entries) {
      const dirPath = join(skillsDir, dirName);
      const dirStat = await stat(dirPath).catch(() => null);
      if (!dirStat?.isDirectory()) continue;

      const skillMdPath = join(dirPath, "SKILL.md");
      let content: string;
      try {
        content = await readFile(skillMdPath, "utf-8");
      } catch {
        continue;
      }

      const { name, description } = parseSkillMd(content);
      const files = await collectEditableFiles(dirPath);
      skills.push({
        name: name || dirName,
        description,
        dirName,
        content,
        source: owner && repo ? `${owner}/${repo}` : display,
        repository: display,
        files,
      });
    }

    if (skills.length === 0) {
      return NextResponse.json(
        { error: "No SKILL.md files found inside skills/ sub-folders" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      skills,
      owner,
      repo,
      repository: display,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch skills from repository",
      },
      { status: 500 },
    );
  } finally {
    if (tmpDir) {
      rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
