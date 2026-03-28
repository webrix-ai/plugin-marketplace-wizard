"use client"

import { useState } from "react"
import Image from "next/image"
import {
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Rocket,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Platform {
  id: string
  name: string
  icon: string
  iconClass?: string
  steps: PlatformStep[]
  docsUrl: string
}

interface PlatformStep {
  title: string
  content: React.ReactNode
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="relative rounded-lg border bg-muted/50 px-3 py-2 pr-9 font-mono text-[11px] leading-relaxed">
      <CopyButton text={children} />
      <pre className="overflow-x-auto whitespace-pre-wrap break-all">
        {children}
      </pre>
    </div>
  )
}

function buildPlatforms(repoUrl: string): Platform[] {
  const repoShort =
    repoUrl
      .replace(/^https?:\/\/github\.com\//, "")
      .replace(/\.git$/, "") || "your-org/my-marketplace"

  return [
    {
      id: "cursor",
      name: "Cursor",
      icon: "/cursor.svg",
      iconClass: "dark:invert",
      docsUrl: "https://cursor.com/docs/plugins",
      steps: [
        {
          title: "Open Plugins settings",
          content: (
            <p className="text-xs text-muted-foreground">
              Go to your Cursor organization{" "}
              <span className="font-medium text-foreground">Dashboard</span> →{" "}
              <span className="font-medium text-foreground">Settings</span> →{" "}
              <span className="font-medium text-foreground">Plugins</span>.
              Find the <span className="font-medium text-foreground">Team Marketplaces</span> section.
            </p>
          ),
        },
        {
          title: "Import marketplace",
          content: (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Click{" "}
                <span className="font-medium text-foreground">
                  + Import Marketplace
                </span>
                , then paste your repository URL:
              </p>
              <CodeBlock>{`https://github.com/${repoShort}`}</CodeBlock>
            </div>
          ),
        },
        {
          title: "Configure distribution",
          content: (
            <p className="text-xs text-muted-foreground">
              Set each plugin as{" "}
              <span className="font-medium text-foreground">Required</span>{" "}
              (auto-installed) or{" "}
              <span className="font-medium text-foreground">Optional</span>{" "}
              (available in marketplace panel). Configure team access groups as needed.
            </p>
          ),
        },
      ],
    },
    {
      id: "claude-code",
      name: "Claude Code",
      icon: "/claude.svg",
      docsUrl: "https://code.claude.com/docs/en/plugin-marketplaces",
      steps: [
        {
          title: "Add the marketplace",
          content: (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                In Claude Code, run:
              </p>
              <CodeBlock>{`/plugin marketplace add ${repoShort}`}</CodeBlock>
            </div>
          ),
        },
        {
          title: "Install a plugin",
          content: (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Browse and install from the Discover tab:
              </p>
              <CodeBlock>{`/plugin`}</CodeBlock>
              <p className="text-xs text-muted-foreground">
                Or install directly via command:
              </p>
              <CodeBlock>{`/plugin install <plugin-name>@<marketplace>`}</CodeBlock>
            </div>
          ),
        },
        {
          title: "Team setup (optional)",
          content: (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Add to{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono">
                  .claude/settings.json
                </code>{" "}
                in your repo to auto-discover:
              </p>
              <CodeBlock>
                {JSON.stringify(
                  {
                    extraKnownMarketplaces: {
                      "my-marketplace": {
                        source: { source: "github", repo: repoShort },
                      },
                    },
                  },
                  null,
                  2,
                )}
              </CodeBlock>
            </div>
          ),
        },
      ],
    },
    {
      id: "claude",
      name: "Claude",
      icon: "/claude.svg",
      docsUrl:
        "https://code.claude.com/docs/en/plugin-marketplaces",
      steps: [
        {
          title: "Open Organization Settings",
          content: (
            <p className="text-xs text-muted-foreground">
              Go to{" "}
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                claude.ai
              </a>{" "}
              →{" "}
              <span className="font-medium text-foreground">
                Organization settings
              </span>{" "}
              →{" "}
              <span className="font-medium text-foreground">Libraries</span> →{" "}
              <span className="font-medium text-foreground">Plugins</span>.
            </p>
          ),
        },
        {
          title: "Add plugins",
          content: (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Click{" "}
                <span className="font-medium text-foreground">Add plugins</span>{" "}
                and select{" "}
                <span className="font-medium text-foreground">
                  Sync from GitHub
                </span>
                . Paste your repository URL:
              </p>
              <CodeBlock>{`https://github.com/${repoShort}`}</CodeBlock>
            </div>
          ),
        },
        {
          title: "Configure access",
          content: (
            <p className="text-xs text-muted-foreground">
              Review the discovered plugins, configure team access settings, then
              click{" "}
              <span className="font-medium text-foreground">Save</span>. Click{" "}
              <span className="font-medium text-foreground">Update</span> at any
              time to pull the latest from your repository.
            </p>
          ),
        },
      ],
    },
    {
      id: "github-copilot",
      name: "GitHub Copilot",
      icon: "/github.svg",
      iconClass: "dark:invert",
      docsUrl:
        "https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-marketplace",
      steps: [
        {
          title: "Add the marketplace",
          content: (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                In your terminal, run:
              </p>
              <CodeBlock>{`copilot plugin marketplace add ${repoShort}`}</CodeBlock>
            </div>
          ),
        },
        {
          title: "Install a plugin",
          content: (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Browse available plugins and install:
              </p>
              <CodeBlock>{`copilot plugin list --available\ncopilot plugin install <plugin-name>`}</CodeBlock>
            </div>
          ),
        },
        {
          title: "Verify",
          content: (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Confirm the plugin loaded correctly:
              </p>
              <CodeBlock>{`copilot plugin list`}</CodeBlock>
            </div>
          ),
        },
      ],
    },
  ]
}

function PlatformSection({
  platform,
  isExpanded,
  onToggle,
}: {
  platform: Platform
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
      >
        <Image
          src={platform.icon}
          alt={platform.name}
          width={18}
          height={18}
          className={cn("shrink-0", platform.iconClass)}
        />
        <span className="flex-1 text-sm font-medium">{platform.name}</span>
        <Badge variant="secondary" className="text-[9px]">
          {platform.steps.length} steps
        </Badge>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      {isExpanded && (
        <div className="border-t px-3 py-3">
          <div className="flex flex-col gap-3">
            {platform.steps.map((step, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                    {idx + 1}
                  </div>
                  {idx < platform.steps.length - 1 && (
                    <div className="mt-1 flex-1 w-px bg-border" />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <p className="text-xs font-medium mb-1.5">{step.title}</p>
                  {step.content}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t">
            <a
              href={platform.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3" />
              Full documentation
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

interface DeploymentWizardProps {
  remoteUrl: string
  onClose: () => void
  onBack: () => void
}

export function DeploymentWizard({
  remoteUrl,
  onClose,
  onBack,
}: DeploymentWizardProps) {
  const [expandedId, setExpandedId] = useState<string | null>("cursor")
  const platforms = buildPlatforms(remoteUrl)

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
            <Rocket className="size-3.5 text-emerald-500" />
          </div>
          <div>
            <DialogTitle>Deploy Your Marketplace</DialogTitle>
            <DialogDescription className="text-xs">
              Follow these steps to wire up your marketplace with each platform
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <ScrollArea className="max-h-[50vh]">
        <div className="flex flex-col gap-2">
          {platforms.map((platform) => (
            <PlatformSection
              key={platform.id}
              platform={platform}
              isExpanded={expandedId === platform.id}
              onToggle={() =>
                setExpandedId(expandedId === platform.id ? null : platform.id)
              }
            />
          ))}
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-auto gap-1.5">
          <ArrowLeft className="size-3" />
          Back
        </Button>
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      </DialogFooter>
    </>
  )
}
