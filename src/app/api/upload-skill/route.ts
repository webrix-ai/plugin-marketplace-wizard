import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import os from "os"
import { execSync } from "child_process"
import { getMarketplaceDir } from "@/lib/get-marketplace-dir"

interface SkillFileEntry {
  relativePath: string
  content: string
}

interface SkillResult {
  name: string
  description: string
  content: string
  files: string[]
  skillFiles: SkillFileEntry[]
}

function parseSkillFrontmatter(content: string): {
  name?: string
  description?: string
} {
  if (!content.startsWith("---")) return {}
  const endIdx = content.indexOf("---", 3)
  if (endIdx === -1) return {}
  const fm = content.slice(3, endIdx).trim()
  const result: Record<string, string> = {}
  for (const line of fm.split("\n")) {
    const i = line.indexOf(":")
    if (i === -1) continue
    result[line.slice(0, i).trim().toLowerCase()] = line
      .slice(i + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "")
  }
  return result
}

function findSkillMd(dir: string): string | null {
  const direct = path.join(dir, "SKILL.md")
  if (fs.existsSync(direct)) return direct

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nested = findSkillMd(path.join(dir, entry.name))
      if (nested) return nested
    }
    if (entry.isFile() && entry.name.toLowerCase() === "skill.md") {
      return path.join(dir, entry.name)
    }
  }
  return null
}

function collectFiles(dir: string, base: string = ""): string[] {
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      results.push(...collectFiles(path.join(dir, entry.name), rel))
    } else {
      results.push(rel)
    }
  }
  return results
}

function extractZip(zipPath: string, destDir: string): void {
  execSync(`unzip -o "${zipPath}" -d "${destDir}"`, {
    stdio: "pipe",
    timeout: 30_000,
  })
}

const EDITABLE_EXTENSIONS = new Set([
  ".md",
  ".json",
  ".yaml",
  ".yml",
  ".txt",
  ".sh",
  ".bash",
  ".js",
  ".ts",
  ".mjs",
  ".cjs",
  ".py",
  ".rb",
  ".toml",
  ".cfg",
  ".ini",
  ".xml",
  ".html",
  ".css",
  ".env",
  ".example",
])

function collectSkillFileContents(skillDir: string): SkillFileEntry[] {
  const result: SkillFileEntry[] = []

  function walk(dir: string, prefix: string) {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue
      const fullPath = path.join(dir, entry.name)
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walk(fullPath, relativePath)
      } else if (entry.isFile() && relativePath !== "SKILL.md") {
        const ext = path.extname(entry.name).toLowerCase()
        if (!ext || !EDITABLE_EXTENSIONS.has(ext)) continue
        try {
          const stat = fs.statSync(fullPath)
          if (stat.size > 100_000) continue
          const content = fs.readFileSync(fullPath, "utf-8")
          result.push({ relativePath, content })
        } catch {
          /* skip */
        }
      }
    }
  }

  walk(skillDir, "")
  return result
}

function processSkillFromDir(
  dir: string,
  fallbackName: string,
): SkillResult | null {
  const skillMdPath = findSkillMd(dir)
  if (!skillMdPath) return null

  const content = fs.readFileSync(skillMdPath, "utf-8")
  const fm = parseSkillFrontmatter(content)
  const files = collectFiles(dir)
  const skillDir = path.dirname(skillMdPath)
  const skillFiles = collectSkillFileContents(skillDir)

  return {
    name: fm.name || fallbackName,
    description: fm.description || "",
    content,
    files,
    skillFiles,
  }
}

export async function POST(request: Request) {
  let tmpDir: string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const fileName = file.name
    const ext = path.extname(fileName).toLowerCase()

    if (ext !== ".zip" && ext !== ".skill") {
      return NextResponse.json(
        {
          error: `Invalid file type "${ext}". Only .zip and .skill files are accepted.`,
        },
        { status: 400 },
      )
    }

    const baseName = path.basename(fileName, ext)
    const bytes = Buffer.from(await file.arrayBuffer())

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pmw-skill-"))
    const zipPath = path.join(tmpDir, baseName + ".zip")
    fs.writeFileSync(zipPath, bytes)

    const extractDir = path.join(tmpDir, "extracted")
    fs.mkdirSync(extractDir, { recursive: true })

    try {
      extractZip(zipPath, extractDir)
    } catch (err) {
      return NextResponse.json(
        {
          error: `Failed to extract zip: ${err instanceof Error ? err.message : "Unknown error"}`,
        },
        { status: 400 },
      )
    }

    const skill = processSkillFromDir(extractDir, baseName)
    if (!skill) {
      return NextResponse.json(
        {
          error:
            "No SKILL.md found in the archive. A valid skill package must contain a SKILL.md file.",
        },
        { status: 400 },
      )
    }

    const installTarget = formData.get("installTo") as string | null
    if (installTarget === "marketplace") {
      const marketplaceDir = getMarketplaceDir()
      const skillSlug = skill.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

      const destSkillDir = path.join(
        marketplaceDir,
        "plugins",
        skillSlug,
        "skills",
        skillSlug,
      )
      fs.mkdirSync(destSkillDir, { recursive: true })

      const skillMdPath = findSkillMd(extractDir)
      if (skillMdPath) {
        const skillDir = path.dirname(skillMdPath)
        copyDirRecursive(skillDir, destSkillDir)
      }
    }

    return NextResponse.json({ success: true, skill })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    )
  } finally {
    if (tmpDir && fs.existsSync(tmpDir)) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      } catch {
        // best-effort cleanup
      }
    }
  }
}

function copyDirRecursive(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}
