"use client"

import {
  ArrowLeft,
  Globe,
  FolderOpen,
  ExternalLink,
  FolderTree,
  FileText,
  FileJson,
  FileCode,
} from "lucide-react"
import McpLogo from "./logo/McpLogo"
import SkillLogo from "./logo/SkillLogo"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useMemo } from "react"
import type {
  McpServer,
  Skill,
  SkillFile,
  RegistryMcpServer,
  RegistrySkillEntry,
} from "@/lib/types"
import { parseSkillFrontmatter } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CopyButton, JsonBlock } from "@/components/plugin-editor/shared"

type DetailItem =
  | { kind: "mcp"; data: McpServer }
  | { kind: "skill"; data: Skill }
  | { kind: "registry-mcp"; data: RegistryMcpServer }
  | { kind: "registry-skill"; data: RegistrySkillEntry }

function McpDetail({ mcp }: { mcp: McpServer }) {
  const configJson: Record<string, unknown> = {}
  if (mcp.config.type) configJson.type = mcp.config.type
  if (mcp.config.command) configJson.command = mcp.config.command
  if (mcp.config.args?.length) configJson.args = mcp.config.args
  if (mcp.config.url) configJson.url = mcp.config.url
  if (mcp.config.env && Object.keys(mcp.config.env).length)
    configJson.env = mcp.config.env
  if (mcp.config.headers && Object.keys(mcp.config.headers).length)
    configJson.headers = mcp.config.headers

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
          <McpLogo color="#34d399" className="size-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{mcp.name}</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>{mcp.sourceApplication}</span>
            <span>·</span>
            {mcp.scope === "global" ? (
              <Badge
                variant="secondary"
                className="h-4 gap-0.5 px-1 text-[9px]"
              >
                <Globe className="size-2.5" /> Global
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="h-4 gap-0.5 px-1 text-[9px]"
              >
                <FolderOpen className="size-2.5" /> Local
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Server Config
        </p>
        <JsonBlock data={{ [mcp.name]: configJson }} />
      </div>

      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Source File
        </p>
        <p className="break-all rounded-lg bg-muted px-2.5 py-1.5 text-[10px] text-muted-foreground">
          {mcp.sourceFilePath}
        </p>
      </div>
    </div>
  )
}

function skillFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "json") return <FileJson className="size-3.5 text-amber-500" />
  if (ext === "md" || ext === "markdown")
    return <FileText className="size-3.5 text-blue-500" />
  if (["js", "ts", "mjs", "cjs", "py", "sh", "bash", "rb"].includes(ext))
    return <FileCode className="size-3.5 text-emerald-500" />
  return <FileText className="size-3.5 text-muted-foreground" />
}

interface ReadonlyFileNode {
  name: string
  children?: ReadonlyFileNode[]
}

function buildReadonlyTree(files?: SkillFile[]): ReadonlyFileNode {
  const root: ReadonlyFileNode = { name: "", children: [] }

  function ensureDir(parts: string[]): ReadonlyFileNode {
    let current = root
    for (const part of parts) {
      if (!current.children) current.children = []
      let child = current.children.find((c) => c.name === part && c.children)
      if (!child) {
        child = { name: part, children: [] }
        current.children.push(child)
      }
      current = child
    }
    return current
  }

  root.children!.push({ name: "SKILL.md" })

  if (files) {
    for (const file of files) {
      const parts = file.relativePath.split("/")
      const fileName = parts.pop()!
      const parent = parts.length > 0 ? ensureDir(parts) : root
      if (!parent.children) parent.children = []
      parent.children.push({ name: fileName })
    }
  }

  return root
}

function ReadonlyTreeItem({
  node,
  depth,
}: {
  node: ReadonlyFileNode
  depth: number
}) {
  const isDir = !!node.children
  const isRoot = isDir && !node.name

  if (isRoot) {
    return (
      <>
        {node.children!.map((child, i) => (
          <ReadonlyTreeItem
            key={`${child.name}-${i}`}
            node={child}
            depth={depth}
          />
        ))}
      </>
    )
  }

  if (isDir) {
    return (
      <div>
        <div
          className="flex items-center gap-1.5 px-1.5 py-0.5 text-[11px]"
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
        >
          <FolderOpen className="size-3.5 text-amber-400" />
          <span className="truncate font-medium">{node.name}/</span>
        </div>
        {node.children!.map((child, i) => (
          <ReadonlyTreeItem
            key={`${child.name}-${i}`}
            node={child}
            depth={depth + 1}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-1.5 px-1.5 py-0.5 text-[11px]"
      style={{ paddingLeft: `${depth * 12 + 6}px` }}
    >
      {skillFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </div>
  )
}

function SkillDetail({ skill }: { skill: Skill }) {
  const { frontmatter, body } = useMemo(
    () => parseSkillFrontmatter(skill.content),
    [skill.content],
  )
  const displayName = frontmatter.name || skill.name
  const displayDesc = frontmatter.description || skill.description

  const fileTree = useMemo(() => buildReadonlyTree(skill.files), [skill.files])
  const totalFiles = 1 + (skill.files?.length ?? 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10">
          <SkillLogo size={20} color="#a78bfa" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{displayName}</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>{skill.sourceApplication}</span>
            <span>·</span>
            {skill.scope === "global" ? (
              <Badge
                variant="secondary"
                className="h-4 gap-0.5 px-1 text-[9px]"
              >
                <Globe className="size-2.5" /> Global
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="h-4 gap-0.5 px-1 text-[9px]"
              >
                <FolderOpen className="size-2.5" /> Local
              </Badge>
            )}
          </div>
        </div>
      </div>

      {displayDesc && (
        <p className="text-xs text-muted-foreground">{displayDesc}</p>
      )}

      {/* File tree */}
      <div>
        <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <FolderTree className="size-3" />
          Skill Files
          <span className="ml-1 font-normal">{totalFiles}</span>
        </p>
        <div className="rounded-lg border bg-muted/30 py-0.5">
          <ReadonlyTreeItem node={fileTree} depth={0} />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            SKILL.md Preview
          </p>
          <CopyButton text={body} />
        </div>
        <div className="skill-markdown max-h-[40vh] overflow-y-auto rounded-lg bg-muted p-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>
      </div>

      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Source Path
        </p>
        <p className="break-all rounded-lg bg-muted px-2.5 py-1.5 text-[10px] text-muted-foreground">
          {skill.sourceFilePath}
        </p>
      </div>
    </div>
  )
}

function RegistryMcpDetail({ server }: { server: RegistryMcpServer }) {
  const configJson: Record<string, unknown> = { name: server.name }
  if (server.version) configJson.version = server.version
  if (server.remotes?.length) configJson.remotes = server.remotes
  if (server.packages?.length) configJson.packages = server.packages

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
          <McpLogo color="#34d399" className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">
            {server.title || server.name}
          </h3>
          <p className="text-[10px] text-muted-foreground">
            MCP Registry · v{server.version}
          </p>
        </div>
      </div>

      {server.description && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {server.description}
        </p>
      )}

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Server Config
        </p>
        <JsonBlock data={configJson} />
      </div>

      {(server.websiteUrl || server.repository?.url) && (
        <div className="flex flex-wrap gap-2">
          {server.websiteUrl && (
            <Button
              variant="outline"
              size="xs"
              render={
                <a
                  href={server.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <ExternalLink data-icon="inline-start" /> Website
            </Button>
          )}
          {server.repository?.url && (
            <Button
              variant="outline"
              size="xs"
              render={
                <a
                  href={server.repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <ExternalLink data-icon="inline-start" /> Repository
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function RegistrySkillDetail({ entry }: { entry: RegistrySkillEntry }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10">
          <SkillLogo size={20} color="#a78bfa" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{entry.name}</h3>
          <p className="text-[10px] text-muted-foreground">
            skills.sh · {entry.installs.toLocaleString()} installs
          </p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Details
        </p>
        <JsonBlock
          data={{
            skillId: entry.skillId,
            name: entry.name,
            source: entry.source,
            installs: entry.installs,
          }}
        />
      </div>

      <Button
        variant="outline"
        size="xs"
        render={
          <a
            href={`https://github.com/${entry.source}`}
            target="_blank"
            rel="noopener noreferrer"
          />
        }
      >
        <ExternalLink data-icon="inline-start" /> View on GitHub
      </Button>
    </div>
  )
}

export function DetailPanel({
  item,
  onClose,
}: {
  item: DetailItem
  onClose: () => void
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {item.kind === "mcp" && <McpDetail mcp={item.data} />}
        {item.kind === "skill" && <SkillDetail skill={item.data} />}
        {item.kind === "registry-mcp" && (
          <RegistryMcpDetail server={item.data} />
        )}
        {item.kind === "registry-skill" && (
          <RegistrySkillDetail entry={item.data} />
        )}
      </div>
    </div>
  )
}

export type { DetailItem }
