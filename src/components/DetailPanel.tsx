"use client";

import { ArrowLeft, Globe, FolderOpen, Copy, Check, ExternalLink } from "lucide-react";
import McpLogo from "./logo/McpLogo";
import SkillLogo from "./logo/SkillLogo";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import type { McpServer, Skill, RegistryMcpServer } from "@/lib/types";
import type { RegistrySkillEntry } from "@/lib/store";
import { cn } from "@/lib/utils";

type DetailItem =
  | { kind: "mcp"; data: McpServer }
  | { kind: "skill"; data: Skill }
  | { kind: "registry-mcp"; data: RegistryMcpServer }
  | { kind: "registry-skill"; data: RegistrySkillEntry };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="rounded p-1 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-300"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function JsonBlock({ data }: { data: unknown }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <div className="relative">
      <div className="absolute top-1.5 right-1.5 z-10">
        <CopyButton text={json} />
      </div>
      <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-[11px] leading-relaxed text-emerald-300/90">
        <code>{json}</code>
      </pre>
    </div>
  );
}

function McpDetail({ mcp }: { mcp: McpServer }) {
  const configJson: Record<string, unknown> = {};
  if (mcp.config.type) configJson.type = mcp.config.type;
  if (mcp.config.command) configJson.command = mcp.config.command;
  if (mcp.config.args?.length) configJson.args = mcp.config.args;
  if (mcp.config.url) configJson.url = mcp.config.url;
  if (mcp.config.env && Object.keys(mcp.config.env).length) configJson.env = mcp.config.env;
  if (mcp.config.headers && Object.keys(mcp.config.headers).length) configJson.headers = mcp.config.headers;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
          <McpLogo color="#34d399" className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{mcp.name}</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span>{mcp.sourceApplication}</span>
            <span>·</span>
            {mcp.scope === "global" ? (
              <span className="flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" /> Global</span>
            ) : (
              <span className="flex items-center gap-0.5"><FolderOpen className="h-2.5 w-2.5" /> Local</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Server Config</p>
        <JsonBlock data={{ [mcp.name]: configJson }} />
      </div>

      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Source File</p>
        <p className="break-all rounded-lg bg-black/30 px-2.5 py-1.5 text-[10px] text-slate-400">
          {mcp.sourceFilePath}
        </p>
      </div>
    </div>
  );
}

function SkillDetail({ skill }: { skill: Skill }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
          <SkillLogo size={20} color="#a78bfa" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{skill.name}</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span>{skill.sourceApplication}</span>
            <span>·</span>
            {skill.scope === "global" ? (
              <span className="flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" /> Global</span>
            ) : (
              <span className="flex items-center gap-0.5"><FolderOpen className="h-2.5 w-2.5" /> Local</span>
            )}
          </div>
        </div>
      </div>

      {skill.description && (
        <p className="text-xs text-slate-400">{skill.description}</p>
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Skill Content</p>
          <CopyButton text={skill.content} />
        </div>
        <div className="skill-markdown max-h-[50vh] overflow-y-auto rounded-lg bg-black/30 p-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{skill.content}</ReactMarkdown>
        </div>
      </div>

      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Source File</p>
        <p className="break-all rounded-lg bg-black/30 px-2.5 py-1.5 text-[10px] text-slate-400">
          {skill.sourceFilePath}
        </p>
      </div>
    </div>
  );
}

function RegistryMcpDetail({ server }: { server: RegistryMcpServer }) {
  const configJson: Record<string, unknown> = { name: server.name };
  if (server.version) configJson.version = server.version;
  if (server.remotes?.length) configJson.remotes = server.remotes;
  if (server.packages?.length) configJson.packages = server.packages;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
          <McpLogo color="#34d399" className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-white">{server.title || server.name}</h3>
          <p className="text-[10px] text-slate-500">MCP Registry · v{server.version}</p>
        </div>
      </div>

      {server.description && (
        <p className="text-xs leading-relaxed text-slate-400">{server.description}</p>
      )}

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Server Config</p>
        <JsonBlock data={configJson} />
      </div>

      {(server.websiteUrl || server.repository?.url) && (
        <div className="flex flex-wrap gap-2">
          {server.websiteUrl && (
            <a
              href={server.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-md bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-slate-400 transition hover:bg-white/[0.08] hover:text-slate-300"
            >
              <ExternalLink className="h-3 w-3" /> Website
            </a>
          )}
          {server.repository?.url && (
            <a
              href={server.repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-md bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-slate-400 transition hover:bg-white/[0.08] hover:text-slate-300"
            >
              <ExternalLink className="h-3 w-3" /> Repository
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function RegistrySkillDetail({ entry }: { entry: RegistrySkillEntry }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
          <SkillLogo size={20} color="#a78bfa" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{entry.name}</h3>
          <p className="text-[10px] text-slate-500">skills.sh · {entry.installs.toLocaleString()} installs</p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Details</p>
        <JsonBlock
          data={{
            skillId: entry.skillId,
            name: entry.name,
            source: entry.source,
            installs: entry.installs,
          }}
        />
      </div>

      <a
        href={`https://github.com/${entry.source}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 rounded-md bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-slate-400 transition hover:bg-white/[0.08] hover:text-slate-300"
      >
        <ExternalLink className="h-3 w-3" /> View on GitHub
      </a>
    </div>
  );
}

export function DetailPanel({
  item,
  onClose,
}: {
  item: DetailItem;
  onClose: () => void;
}) {
  return (
    <div className={cn("absolute inset-0 z-20 flex flex-col bg-[#0d1017]")}>
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
        <button
          onClick={onClose}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {item.kind === "mcp" && <McpDetail mcp={item.data} />}
        {item.kind === "skill" && <SkillDetail skill={item.data} />}
        {item.kind === "registry-mcp" && <RegistryMcpDetail server={item.data} />}
        {item.kind === "registry-skill" && <RegistrySkillDetail entry={item.data} />}
      </div>
    </div>
  );
}

export type { DetailItem };
