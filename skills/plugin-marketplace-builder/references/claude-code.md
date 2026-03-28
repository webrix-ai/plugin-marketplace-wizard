# Claude Code Plugin Marketplace

Everything needed to build and deploy plugins and marketplaces for Claude Code.

## Table of Contents

- [Plugin Structure](#plugin-structure)
- [Marketplace Manifest](#marketplace-manifest)
- [Plugin Manifest](#plugin-manifest)
- [Component Layout](#component-layout)
- [Plugin Settings](#plugin-settings)
- [Hook System](#hook-system)
- [Deployment (CLI)](#deployment-cli)
- [Deployment (Organization)](#deployment-organization)
- [Team Configuration](#team-configuration)

---

## Plugin Structure

Claude Code plugins follow a conventional directory layout with auto-discovery:

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest (required)
├── commands/                 # Slash commands (.md files)
├── agents/                   # Subagent definitions (.md files)
├── skills/                   # Skills (subdirectories with SKILL.md)
│   └── skill-name/
│       └── SKILL.md
├── hooks/
│   └── hooks.json           # Event handler configuration
├── .mcp.json                # MCP server definitions
└── scripts/                 # Helper scripts
```

Components load automatically: commands/agents as `.md` files in their directories, skills as subdirectories containing `SKILL.md`, hooks via JSON config.

## Marketplace Manifest

Location: `.claude-plugin/marketplace.json`

```json
{
  "name": "my-marketplace",
  "owner": { "name": "Team Name", "email": "team@example.com" },
  "metadata": {
    "description": "Plugin marketplace for my org",
    "version": "1.0.0"
  },
  "plugins": [
    {
      "name": "my-plugin",
      "source": "./plugins/my-plugin",
      "description": "What this plugin does",
      "version": "1.0.0",
      "author": { "name": "Author" },
      "category": "productivity",
      "tags": ["automation"],
      "strict": false
    }
  ]
}
```

Source is a relative path from repository root (`./plugins/<slug>`).

## Plugin Manifest

Location: `.claude-plugin/plugin.json` (inside each plugin directory)

```json
{
  "name": "my-plugin",
  "description": "What this plugin does",
  "version": "1.0.0",
  "author": { "name": "Author Name", "email": "author@example.com" },
  "homepage": "https://example.com",
  "repository": "https://github.com/org/plugin",
  "license": "MIT",
  "keywords": ["testing", "automation"]
}
```

Only `name` is strictly required. All other fields are recommended.

## Component Layout

### Commands (`commands/*.md`)

```markdown
---
name: command-name
description: Command description
---

Command implementation instructions...
```

Integrate as native slash commands (`/command-name`).

### Skills (`skills/<name>/SKILL.md`)

```markdown
---
name: skill-name
description: When to apply this skill
---

Procedural instructions for the agent...
```

Claude activates skills automatically based on task context matching the description.

### Agents (`agents/<name>.md`)

```markdown
---
description: Agent role and expertise
capabilities:
  - Specific task 1
  - Specific task 2
---

Detailed agent instructions and knowledge...
```

### MCP Servers (`.mcp.json`)

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/servers/server.js"],
      "env": { "API_KEY": "${API_KEY}" }
    }
  }
}
```

Use `${CLAUDE_PLUGIN_ROOT}` for portable intra-plugin path references.

### Hooks (`hooks/hooks.json`)

```json
{
  "PreToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/validate.sh",
          "timeout": 30
        }
      ]
    }
  ]
}
```

**Hook events:** SessionStart, InstructionsLoaded, UserPromptSubmit, PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure, Notification, SubagentStart, SubagentStop, Stop, StopFailure, TeammateIdle, TaskCompleted, ConfigChange, WorktreeCreate, WorktreeRemove, PreCompact, PostCompact, Elicitation, ElicitationResult, SessionEnd

**Handler types:** `command` (shell), `http` (webhook), `prompt` (LLM prompt), `agent` (subagent prompt)

## Plugin Settings

Per-project plugin configuration at `.claude/plugin-name.local.md`:

```markdown
---
enabled: true
strict_mode: false
max_retries: 3
---

# Additional Context

Markdown body for extra instructions or task context.
```

Read from hooks/commands using bash frontmatter parsing:

```bash
STATE_FILE=".claude/my-plugin.local.md"
if [[ ! -f "$STATE_FILE" ]]; then exit 0; fi
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$STATE_FILE")
ENABLED=$(echo "$FRONTMATTER" | grep '^enabled:' | sed 's/enabled: *//')
```

Settings files should be in `.gitignore`. Changes require Claude Code restart.

## Deployment (CLI)

### Add Marketplace

```shell
/plugin marketplace add your-org/my-marketplace        # GitHub shorthand
/plugin marketplace add https://gitlab.com/org/repo.git # any git host
/plugin marketplace add ./my-marketplace                # local directory
```

### Browse & Install

```shell
/plugin                                    # interactive plugin manager
/plugin install my-plugin@my-marketplace   # direct install
```

Installation scopes: **User** (default, across all projects), **Project** (for all collaborators), **Local** (just you, this repo).

### Activate & Update

```shell
/reload-plugins                            # activate after install
/plugin marketplace update my-marketplace  # pull latest
```

Enable auto-updates in `/plugin` → Marketplaces → Enable auto-update.

### Manage

```shell
/plugin disable my-plugin@my-marketplace
/plugin enable my-plugin@my-marketplace
/plugin uninstall my-plugin@my-marketplace
/plugin marketplace remove my-marketplace
```

## Deployment (Organization)

For deploying via claude.ai / Anthropic Console:

1. Organization settings → Libraries → Plugins → **Add plugins**
2. **Sync from GitHub**: paste repo URL, Claude parses `.claude-plugin/marketplace.json`
3. **Upload a file**: zip your marketplace (`zip -r marketplace.zip .`), upload

Submit for public listing at `claude.ai/settings/plugins/submit` or `platform.claude.com/plugins/submit`.

## Team Configuration

Auto-prompt teammates to install your marketplace — add to `.claude/settings.json` in your repository:

```json
{
  "extraKnownMarketplaces": {
    "my-marketplace": {
      "source": { "source": "github", "repo": "your-org/my-marketplace" }
    }
  },
  "enabledPlugins": {
    "my-plugin@my-marketplace": true
  }
}
```

## Local Testing

```shell
/plugin marketplace add ./my-marketplace
/plugin install my-plugin@my-marketplace
/reload-plugins
```

## Further Reading

- [Discover and install plugins](https://code.claude.com/docs/en/discover-plugins)
- [Create and distribute a plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
- [Plugins reference](https://code.claude.com/docs/en/plugins-reference)
