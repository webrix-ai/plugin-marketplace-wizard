"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Github,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  Rocket,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DeploymentWizard } from "./DeploymentWizard"

interface Props {
  open: boolean
  onClose: () => void
}

type GitStatus =
  | { status: "loading" }
  | { status: "no-git" }
  | { status: "no-remote" }
  | { status: "ready"; remoteUrl: string }

type PublishPhase = "idle" | "pushing" | "success" | "error"
type DialogView = "publish" | "deploy"

interface PublishResult {
  message?: string
  branch?: string
  commitMessage?: string
  remoteUrl?: string
  error?: string
}

export function PublishDialog({ open, onClose }: Props) {
  const [gitStatus, setGitStatus] = useState<GitStatus>({ status: "loading" })
  const [phase, setPhase] = useState<PublishPhase>("idle")
  const [result, setResult] = useState<PublishResult | null>(null)
  const [view, setView] = useState<DialogView>("publish")

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("idle")
    setResult(null)
    setView("publish")
    setGitStatus({ status: "loading" })

    fetch("/api/publish")
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "no-git") setGitStatus({ status: "no-git" })
        else if (data.status === "no-remote")
          setGitStatus({ status: "no-remote" })
        else setGitStatus({ status: "ready", remoteUrl: data.remoteUrl })
      })
      .catch(() => setGitStatus({ status: "no-git" }))
  }, [open])

  const handlePublish = useCallback(async () => {
    setPhase("pushing")
    try {
      const res = await fetch("/api/publish", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setPhase("error")
        setResult({ error: data.error ?? "Unknown error" })
        return
      }
      setPhase("success")
      setResult(data)
    } catch (e) {
      setPhase("error")
      setResult({ error: e instanceof Error ? e.message : "Network error" })
    }
  }, [])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && phase !== "pushing") onClose()
  }

  const remoteUrl =
    gitStatus.status === "ready" ? gitStatus.remoteUrl : ""

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={view === "deploy" ? "sm:max-w-lg" : "sm:max-w-md"}
      >
        {view === "deploy" ? (
          <DeploymentWizard
            remoteUrl={remoteUrl}
            onClose={onClose}
            onBack={() => setView("publish")}
          />
        ) : (
          <>
            {gitStatus.status === "loading" && <LoadingState />}
            {(gitStatus.status === "no-git" ||
              gitStatus.status === "no-remote") && (
              <NoRepoState onClose={onClose} />
            )}
            {gitStatus.status === "ready" && (
              <ReadyState
                remoteUrl={gitStatus.remoteUrl}
                phase={phase}
                result={result}
                onPublish={handlePublish}
                onClose={onClose}
                onShowDeploy={() => setView("deploy")}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function LoadingState() {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Checking repository…</DialogTitle>
        <DialogDescription className="sr-only">
          Detecting git configuration
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    </>
  )
}

function NoRepoState({ onClose }: { onClose: () => void }) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
            <AlertCircle className="size-3.5 text-amber-500" />
          </div>
          <div>
            <DialogTitle>Connect to GitHub</DialogTitle>
            <DialogDescription className="sr-only">
              No git remote configured
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground">
        <p>
          This directory doesn&apos;t have a remote git repository configured.
          To publish your marketplace, connect it to GitHub first:
        </p>
        <ol className="flex flex-col gap-1.5 pl-5 list-decimal text-xs">
          <li>
            Create a repository on{" "}
            <a
              href="https://github.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-3 hover:text-foreground"
            >
              github.com/new
            </a>
          </li>
          <li>
            Run{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              git remote add origin &lt;url&gt;
            </code>
          </li>
          <li>Push your first commit</li>
        </ol>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  )
}

function ReadyState({
  remoteUrl,
  phase,
  result,
  onPublish,
  onClose,
  onShowDeploy,
}: {
  remoteUrl: string
  phase: PublishPhase
  result: PublishResult | null
  onPublish: () => void
  onClose: () => void
  onShowDeploy: () => void
}) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
            {phase === "success" ? (
              <CheckCircle2 className="size-3.5 text-emerald-500" />
            ) : (
              <Github className="size-3.5 text-primary" />
            )}
          </div>
          <div>
            <DialogTitle>
              {phase === "success" ? "Published!" : "Publish Marketplace"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Commit and push changes to your repository
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex w-full max-w-full items-center gap-2 overflow-hidden rounded-lg border bg-muted/50 px-3 py-2">
          <GitBranch className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate text-xs font-mono text-muted-foreground">
            {remoteUrl}
          </span>
        </div>

        {phase === "idle" && (
          <p className="text-sm text-muted-foreground">
            This will commit all changes and push them to the repository above.
          </p>
        )}

        {phase === "pushing" && (
          <div className="flex items-center gap-2.5 py-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>Committing and pushing changes…</span>
          </div>
        )}

        {phase === "success" && result && (
          <div className="flex flex-col gap-1.5 text-sm">
            <p className="text-emerald-600 dark:text-emerald-400">
              {result.message}
            </p>
            {result.commitMessage && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Commit:</span>{" "}
                {result.commitMessage}
              </p>
            )}
          </div>
        )}

        {phase === "error" && result?.error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>{result.error}</span>
          </div>
        )}
      </div>

      <DialogFooter>
        {phase === "idle" && (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onPublish}>Publish</Button>
          </>
        )}
        {phase === "pushing" && (
          <Button disabled>
            <Loader2 className="animate-spin" />
            Publishing…
          </Button>
        )}
        {phase === "success" && (
          <>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onShowDeploy} className="gap-1.5">
              <Rocket className="size-3.5" />
              Deploy
            </Button>
          </>
        )}
        {phase === "error" && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </DialogFooter>
    </>
  )
}
