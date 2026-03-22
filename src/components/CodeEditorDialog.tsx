"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Editor, { type OnMount } from "@monaco-editor/react"
import type { editor } from "monaco-editor"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export type EditorLanguage =
  | "json"
  | "markdown"
  | "yaml"
  | "javascript"
  | "typescript"
  | "python"
  | "shell"
  | "html"
  | "css"
  | "xml"
  | "plaintext"

interface CodeEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  language: EditorLanguage
  value: string
  onSave: (value: string) => void
  validate?: (value: string) => string | null
}

export function CodeEditorDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  language,
  value,
  onSave,
  validate,
}: CodeEditorDialogProps) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"editor" | "preview">("editor")
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const isMarkdown = language === "markdown"

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevValue, setPrevValue] = useState(value)
  if (prevOpen !== open || prevValue !== value) {
    setPrevOpen(open)
    setPrevValue(value)
    if (open) {
      setDraft(value)
      setError(null)
    }
  }

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor
    setTimeout(() => editor.focus(), 100)
  }, [])

  const handleSave = useCallback(() => {
    if (validate) {
      const err = validate(draft)
      if (err) {
        setError(err)
        return
      }
    }
    onSave(draft)
    onOpenChange(false)
  }, [draft, validate, onSave, onOpenChange])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    },
    [handleSave],
  )

  useEffect(() => {
    if (!open) return
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, handleKeyDown])

  const isDirty = draft !== value

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[85vh] max-h-[85vh] w-[90vw] flex-col sm:max-w-4xl"
        showCloseButton
      >
        <DialogHeader className="flex flex-row items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <DialogTitle>{title}</DialogTitle>
            {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
          </div>
          {isMarkdown && (
            <div className="flex shrink-0 items-center rounded-md border bg-muted p-0.5">
              <button
                type="button"
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === "editor"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setViewMode("editor")}
              >
                Markdown
              </button>
              <button
                type="button"
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === "preview"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setViewMode("preview")}
              >
                Preview
              </button>
            </div>
          )}
        </DialogHeader>

        {viewMode === "preview" && isMarkdown ? (
          <div className="skill-markdown min-h-0 flex-1 overflow-y-auto rounded-lg border bg-muted p-4">
            {draft.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
            ) : (
              <p className="text-xs italic text-muted-foreground">
                Nothing to preview
              </p>
            )}
          </div>
        ) : (
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border bg-[#1e1e1e]">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={draft}
              onChange={(v) => {
                setDraft(v ?? "")
                setError(null)
              }}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap:
                  language === "markdown" || language === "plaintext"
                    ? "on"
                    : "off",
                tabSize: 2,
                automaticLayout: true,
                padding: { top: 12 },
                renderLineHighlight: "gutter",
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
            <AlertCircle className="size-4 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {isDirty ? "Unsaved changes" : "No changes"}
              <span className="ml-3 text-[10px] opacity-60">
                {typeof navigator !== "undefined" &&
                /Mac|iPhone|iPad/.test(navigator.platform)
                  ? "⌘S"
                  : "Ctrl+S"}{" "}
                to save
              </span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button size="sm" disabled={!isDirty} onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
