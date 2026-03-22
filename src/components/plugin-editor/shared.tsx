"use client"

import { useState } from "react"
import { Copy, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ValidationIssue } from "@/lib/validate-marketplace"

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <Button variant="ghost" size="icon-xs" onClick={copy} title="Copy">
      {copied ? <Check className="text-emerald-500" /> : <Copy />}
    </Button>
  )
}

export function JsonBlock({ data }: { data: unknown }) {
  const json = JSON.stringify(data, null, 2)
  return (
    <div className="relative">
      <div className="absolute top-1.5 right-1.5 z-10">
        <CopyButton text={json} />
      </div>
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed text-primary">
        <code>{json}</code>
      </pre>
    </div>
  )
}

export function ValidationIssueList({
  issues,
  title = "Issues",
}: {
  issues: ValidationIssue[]
  title?: string
}) {
  if (issues.length === 0) return null

  const errors = issues.filter((i) => i.severity !== "warning")
  const warnings = issues.filter((i) => i.severity === "warning")

  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-red-500/10 px-2.5 py-1.5">
        <AlertCircle className="size-3 shrink-0 text-red-500" />
        <span className="text-[10px] font-semibold">
          {errors.length > 0 && (
            <span className="text-red-500">
              {errors.length} error{errors.length !== 1 ? "s" : ""}
            </span>
          )}
          {errors.length > 0 && warnings.length > 0 && (
            <span className="text-muted-foreground"> · </span>
          )}
          {warnings.length > 0 && (
            <span className="text-amber-500">
              {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
            </span>
          )}
          <span className="ml-1 text-muted-foreground font-normal">
            in {title}
          </span>
        </span>
      </div>
      <div className="flex flex-col divide-y divide-red-500/10">
        {issues.map((issue, i) => (
          <div key={i} className="flex items-center gap-2 px-2.5 py-1.5">
            <span
              className={`size-1.5 shrink-0 rounded-full ${
                issue.severity === "warning" ? "bg-amber-500" : "bg-red-500"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px]">{issue.message}</p>
              <p className="truncate font-mono text-[9px] text-muted-foreground">
                {issue.path}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
